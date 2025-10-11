import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductsService } from '../../services/products';
import { StorageService } from '../../services/storage';
import { ImageService } from '../../services/image';
import { CategoriesService } from '../../services/categories';
import { ICategory } from '../../interfaces/category';
import { INewProductRequest, ImagePreview } from '../../interfaces/new-product-request';
import { forkJoin, switchMap, take } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-product',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './new-product.html',
  styleUrl: './new-product.css'
})
export class NewProduct implements OnInit {
  successMessage = signal('');
  errorMessage = signal('');
  images = signal<ImagePreview[]>([]);
  categories: ICategory[] = [];
  isLoading = signal(false);
  uploadProgress = signal(0);
  isDragging = signal(false);

  maxImages = 5;

  productForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    price: new FormControl(0, [Validators.required]),
    description: new FormControl('', [Validators.required]),
    category: new FormControl('', [Validators.required]),
    status: new FormControl('Disponível', [Validators.required]),
  });

  private readonly _productsService = inject(ProductsService);
  private readonly _storageService = inject(StorageService);
  private readonly _imageService = inject(ImageService);
  private readonly _categoriesService = inject(CategoriesService);
  private readonly _router = inject(Router);

  ngOnInit() {
    forkJoin({
      categories: this._categoriesService.getCategories(),
    }).pipe(take(1)).subscribe({
      next: (response) => {
        this.categories = response.categories;
      },
      error: (error) => {
        console.error('Erro ao carregar dados:', error);
      }
    });
  }

  async saveProduct() {
    if (this.productForm.invalid || this.images().length === 0) return;

    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.uploadProgress.set(0);

    try {
      // Otimizar todas as imagens
      const optimizedImages = await Promise.all(
        this.images().map(img => this._imageService.optimizeImage(img.file))
      );

      // Upload de todas as imagens para o Storage
      const uploadObservables = optimizedImages.map((file, index) => {
        const path = this._storageService.generateImagePath(file.name);
        return this._storageService.uploadImage(file, path);
      });

      // Aguardar todos os uploads
      forkJoin(uploadObservables).pipe(
        take(1),
        switchMap((imageUrls) => {
          const newProduct: INewProductRequest = {
            title: this.productForm.value.title as string,
            description: this.productForm.value.description as string,
            price: this.productForm.value.price as number,
            category: this.productForm.value.category as string,
            imageMain: imageUrls[0],
            images: imageUrls
          };

          return this._productsService.saveProduct(newProduct);
        })
      ).subscribe({
        next: (response) => {
          this.successMessage.set(response.message);
          this.isLoading.set(false);
          this.uploadProgress.set(100);
          this.resetForm();

          setTimeout(() => {
            this._router.navigate(['/products']);
          }, 1500);
        },
        error: (error) => {
          console.error('Erro ao salvar produto:', error);
          this.errorMessage.set('Erro ao salvar produto. Tente novamente.');
          this.isLoading.set(false);
        }
      });
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      this.errorMessage.set('Erro ao processar imagens');
      this.isLoading.set(false);
    }
  }

  async onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
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
      // Validar arquivo
      const validation = this._imageService.validateImageFile(file);
      if (!validation.valid) {
        this.errorMessage.set(validation.error || 'Arquivo inválido');
        continue;
      }

      // Criar preview
      try {
        const preview = await this._imageService.fileToBase64(file);
        const newImage: ImagePreview = {
          file,
          preview,
          index: currentImages.length
        };

        this.images.update(imgs => [...imgs, newImage]);
        this.errorMessage.set('');
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
      }
    }
  }

  removeImage(index: number) {
    this.images.update(imgs => imgs.filter(img => img.index !== index));
  }

  // Drag & Drop handlers
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

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await this.processFiles(Array.from(files));
    }
  }

  cancel() {
    this._router.navigate(['/products']);
  }

  resetForm() {
    this.productForm.reset({
      title: '',
      price: 0,
      description: '',
      category: '',
      status: 'Disponível'
    });
    this.images.set([]);
    this.uploadProgress.set(0);
  }
}
