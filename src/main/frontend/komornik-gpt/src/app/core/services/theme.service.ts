import {inject, Injectable, Renderer2, RendererFactory2} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private colorTheme: string;

  constructor() {
    const rendererFactory = inject(RendererFactory2);
    this.renderer = rendererFactory.createRenderer(null, null);
    this.colorTheme = localStorage.getItem('user-theme') || 'light-theme';
  }

  initTheme() {
    this.renderer.addClass(document.body, this.colorTheme);
  }

  updateTheme(theme: 'light-theme' | 'dark-theme') {
    this.renderer.removeClass(document.body, this.colorTheme);
    this.renderer.addClass(document.body, theme);
    this.colorTheme = theme;
    localStorage.setItem('user-theme', theme);
  }

  isDarkMode() {
    return this.colorTheme === 'dark-theme';
  }
}
