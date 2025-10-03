import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductsService } from '../../services/products';
import { StorageService } from '../../services/storage';
import { INewProductRequest } from '../../interfaces/new-product-request';
import { switchMap, take } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-product',
  imports: [ReactiveFormsModule],
  templateUrl: './new-product.html',
  styleUrl: './new-product.css'
})
export class NewProduct {
  successMessage = '';
  productImageBase64 = '';
  selectedFile: File | null = null;
  isLoading = false;

  productForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    price: new FormControl(0, [Validators.required]),
    description: new FormControl('', [Validators.required]),
    category: new FormControl('', [Validators.required]),
  });

  private readonly _productsService = inject(ProductsService);
  private readonly _storageService = inject(StorageService);
  private readonly _router = inject(Router);

  saveProduct() {
    if (this.productForm.invalid || !this.selectedFile) return;

    this.isLoading = true;
    this.successMessage = '';

    const imagePath = this._storageService.generateImagePath(this.selectedFile.name);

    this._storageService.uploadImage(this.selectedFile, imagePath)
      .pipe(
        take(1),
        switchMap((imageUrl) => {
          const newProduct: INewProductRequest = {
            title: this.productForm.value.title as string,
            description: this.productForm.value.description as string,
            price: this.productForm.value.price as number,
            category: this.productForm.value.category as string,
            imageBase64: imageUrl,
          };

          return this._productsService.saveProduct(newProduct);
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.isLoading = false;
          this.resetForm();
          this._router.navigate(['/products']);
        },
        error: (error) => {
          console.error('Erro ao salvar produto:', error);
          this.successMessage = 'Erro ao salvar produto';
          this.isLoading = false;
        }
      });
  }

  saveProductWithBase64() {
    if (this.productForm.invalid || !this.productImageBase64) return;

    this.isLoading = true;

    const newProduct: INewProductRequest = {
      title: this.productForm.value.title as string,
      description: this.productForm.value.description as string,
      price: this.productForm.value.price as number,
      category: this.productForm.value.category as string,
      imageBase64: this.productImageBase64,
    };

    this._productsService.saveProduct(newProduct).pipe(take(1)).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.isLoading = false;
        this.resetForm();
        this._router.navigate(['/products']);
      },
      error: (error) => {
        console.error('Erro ao salvar produto:', error);
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;
      this.convertFileToBase64(file);
    }
  }

  convertFileToBase64(file: File) {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      this.productImageBase64 = e.target.result as string;
    };
    reader.onerror = () => {
      this.productImageBase64 = '';
    };

    reader.readAsDataURL(file);
  }

  cancel() {
    this._router.navigate(['/products']);
  }

  resetForm() {
    this.productForm.reset();
    this.productImageBase64 = '';
    this.selectedFile = null;
  }
}
