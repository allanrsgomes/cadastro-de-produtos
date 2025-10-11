import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService } from '../../services/products';
import { StorageService } from '../../services/storage';
import { ImageService } from '../../services/image';
import { CategoriesService } from '../../services/categories';
import { ICategory } from '../../interfaces/category';
import { IProductResponse } from '../../interfaces/product-response';
import { IImagePreview } from '../../interfaces/image-preview.response';
import { forkJoin, take } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './edit-product.html',
  styleUrl: './edit-product.css'
})
export class EditProduct implements OnInit {
  productId = '';
  product = signal<IProductResponse | null>(null);
  successMessage = signal('');
  errorMessage = signal('');
  images = signal<IImagePreview[]>([]);
  categories: ICategory[] = [];
  isLoadingPage = true;
  isLoading = signal(false);
  isDeleting = signal(false);
  uploadProgress = signal(0);
  isDragging = signal(false);
  maxImages = 5;

  productForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    price: new FormControl(0, [Validators.required]),
    description: new FormControl('', [Validators.required]),
    category: new FormControl('', [Validators.required]),
    status: new FormControl('', [Validators.required]),
  });

  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _productsService = inject(ProductsService);
  private readonly _storageService = inject(StorageService);
  private readonly _imageService = inject(ImageService);
  private readonly _categoriesService = inject(CategoriesService);

  ngOnInit() {
    this.productId = this._route.snapshot.params['id'];
    this.loadInitialData();
  }

  loadInitialData() {
    this.isLoadingPage = true;

    forkJoin({
      product: this._productsService.getProductById(this.productId),
      categories: this._categoriesService.getCategories(),
    }).pipe(take(1)).subscribe({
      next: (response) => {
        const { product, categories } = response;

        this.product.set(product);
        this.categories = categories;

        // Preenche o formulário com os dados do produto
        this.productForm.patchValue({
          title: product.title,
          price: product.price,
          description: product.description,
          category: product.category,
          status: product.status
        });

        // Prepara as imagens existentes para exibição
        const existingImages: IImagePreview[] = (product.images || [product.imageMain])
          .filter(url => !!url)
          .map((url, index) => ({
            preview: url,
            index,
            isExisting: true,
            url
          }));

        this.images.set(existingImages);
        this.isLoadingPage = false;
      },
      error: (error) => {
        console.error('Erro ao carregar dados da página:', error);
        this.errorMessage.set('Erro ao carregar os dados do produto.');
        this.isLoadingPage = false;
        setTimeout(() => this._router.navigate(['/products']), 2000);
      }
    });
  }

  /**
   * Atualiza o produto com os novos dados do formulário e imagens.
   */
  async updateProduct() {
    if (this.productForm.invalid || this.images().length === 0) return;

    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.uploadProgress.set(0);

    try {
      const currentImages = this.images();
      const newImageFiles = currentImages.filter(img => !img.isExisting && img.file).map(img => img.file!);
      const existingImageUrls = currentImages.filter(img => img.isExisting).map(img => img.url!);

      let newImageUrls: string[] = [];

      if (newImageFiles.length > 0) {
        const optimizedImages = await Promise.all(
          newImageFiles.map(file => this._imageService.optimizeImage(file))
        );
        const uploadObservables = optimizedImages.map(file => {
          const path = this._storageService.generateImagePath(file.name);
          return this._storageService.uploadImage(file, path);
        });
        newImageUrls = await forkJoin(uploadObservables).pipe(take(1)).toPromise() || [];
      }

      const allImageUrls = [...existingImageUrls, ...newImageUrls];

      const updatedProduct: Partial<IProductResponse> = {
        title: this.productForm.value.title as string,
        description: this.productForm.value.description as string,
        price: this.productForm.value.price as number,
        category: this.productForm.value.category as string,
        status: this.productForm.value.status as string,
        imageMain: allImageUrls[0],
        images: allImageUrls
      };

      this._productsService.updateProduct(this.productId, updatedProduct).pipe(take(1)).subscribe({
        next: () => {
          this.successMessage.set('Produto atualizado com sucesso!');
          this.isLoading.set(false);
          this.uploadProgress.set(100);
          setTimeout(() => this._router.navigate(['/products']), 1500);
        },
        error: (error) => {
          console.error('Erro ao atualizar produto:', error);
          this.errorMessage.set('Erro ao atualizar produto. Tente novamente.');
          this.isLoading.set(false);
        }
      });

    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      this.errorMessage.set('Erro ao processar imagens');
      this.isLoading.set(false);
    }
  }

  deleteProduct() {
    const confirmDelete = window.confirm(`Tem certeza que deseja excluir "${this.product()?.title}"?\n\nEsta ação não pode ser desfeita.`);
    if (!confirmDelete) return;

    this.isDeleting.set(true);
    this._productsService.deleteProduct(this.productId).pipe(take(1)).subscribe({
      next: () => {
        this.successMessage.set('Produto excluído com sucesso!');
        setTimeout(() => this._router.navigate(['/products']), 1000);
      },
      error: (error) => {
        console.error('Erro ao excluir produto:', error);
        this.errorMessage.set('Erro ao excluir produto');
        this.isDeleting.set(false);
      }
    });
  }

  async onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      await this.processFiles(Array.from(input.files));
    }
  }

  async processFiles(files: File[]) {
    const currentImages = this.images();
    const remainingSlots = this.maxImages - currentImages.length;
    if (remainingSlots <= 0) {
      this.errorMessage.set(`Máximo de ${this.maxImages} imagens permitidas`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    for (const file of filesToProcess) {
      const validation = this._imageService.validateImageFile(file);
      if (!validation.valid) {
        this.errorMessage.set(validation.error || 'Arquivo inválido');
        continue;
      }
      try {
        const preview = await this._imageService.fileToBase64(file);
        const newImage: IImagePreview = { file, preview, index: currentImages.length, isExisting: false };
        this.images.update(imgs => [...imgs, newImage]);
        this.errorMessage.set('');
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
      }
    }
  }

  removeImage(indexToRemove: number) {
    this.images.update(imgs => {
      const filtered = imgs.filter(img => img.index !== indexToRemove);
      return filtered.map((img, i) => ({ ...img, index: i })); // Re-indexa para manter a consistência
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    if (event.dataTransfer?.files) {
      await this.processFiles(Array.from(event.dataTransfer.files));
    }
  }

  cancel() {
    this._router.navigate(['/products']);
  }
}
