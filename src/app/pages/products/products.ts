import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductsService } from '../../services/products';
import { CategoriesService } from '../../services/categories';
import { ICategory } from '../../interfaces/category';
import { forkJoin, take } from 'rxjs';
import { IProductResponse } from '../../interfaces/product-response';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class Products implements OnInit {
  products: IProductResponse[] = [];
  filteredProducts: IProductResponse[] = [];
  categories: ICategory[] = [];

  filterForm = new FormGroup({
    title: new FormControl(''),
    status: new FormControl(''),
    category: new FormControl(''),
  });

  private readonly _productsService = inject(ProductsService);
  private readonly _categoriesService = inject(CategoriesService);
  private readonly _router = inject(Router);

  ngOnInit() {
    forkJoin({
      products: this._productsService.getProducts(),
      categories: this._categoriesService.getCategories(),
    }).pipe(take(1)).subscribe({
      next: (response) => {
        this.products = response.products.data;
        this.filteredProducts = response.products.data;
        this.categories = response.categories;
      },
      error: (error) => {
        console.error('Erro ao carregar dados:', error);
      }
    });

    this.filterForm.valueChanges.subscribe(() => {
      this.filterProducts();
    });
  }

  filterProducts() {
    const title = this.filterForm.value.title?.toLowerCase() || '';
    const status = this.filterForm.value.status?.toLowerCase() || '';
    const category = this.filterForm.value.category?.toLowerCase() || '';

    this.filteredProducts = this.products.filter((product) => {

      const matchesTitle = !title || product.title.toLowerCase().includes(title);
      const matchesStatus = !status || product.status.toLowerCase() === status;
      const matchesCategory = !category || product.category.toLowerCase() === category;

      return matchesTitle && matchesStatus && matchesCategory;
    });
  }

  clearFilter() {
    this.filterForm.reset({
      title: '',
      status: '',
      category: '',
    });

    this.filteredProducts = this.products;
  }

  newProduct() {
    this._router.navigate(['/new-product']);
  }

  editProduct(productId: string) {
    this._router.navigate(['/edit-product', productId]);
  }
}
