import {inject, Injectable} from '@angular/core';
import {Expense} from '../models/expense.model';
import {NotificationService} from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {
  private notificationService = inject(NotificationService);

  // Dodajemy async przed nazwą metody
  async exportExpensesToExcel(expenses: Expense[], groupName: string): Promise<void> {
    try {
      const XLSX = await import('xlsx');

      const worksheetData = this.prepareWorksheetData(expenses);

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      worksheet['!cols'] = [
        {wch: 12}, {wch: 30}, {wch: 25}, {wch: 10},
        {wch: 8}, {wch: 20}, {wch: 40}, {wch: 12}
      ];

      const sheetName = `Wydatki ${groupName || 'Grupa'}`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const fileName = `wydatki_${groupName?.replace(/[^a-zA-Z0-9]/g, '_') || 'grupa'}_${new Date().toISOString().split('T')[0]}.xlsx`;

      XLSX.writeFile(workbook, fileName);

      this.notificationService.showSuccess('Plik Excel został pobrany');

    } catch (error) {
      console.error('Błąd podczas eksportu do Excel:', error);
      this.notificationService.showError('Błąd podczas eksportu do Excel');
    }
  }

  private prepareWorksheetData(expenses: Expense[]): any[][] {
    // Nagłówki
    const headers = ['Data', 'Opis', 'Kategoria', 'Kwota', 'Waluta', 'Płacił', 'Uczestnicy', 'Uregulowane'];

    // Dane - sortowane chronologicznie (najnowsze pierwsze)
    const sortedExpenses = expenses.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const rows = sortedExpenses.map(expense => [
      new Date(expense.date).toLocaleDateString('pl-PL'),
      expense.description,
      `${expense.category?.mainCategory || 'Bez Kategorii'} - ${expense.category?.subCategory || 'Ogólne'}`,
      expense.amount,
      expense.currency,
      expense.payer.name,
      expense.splits.map(split => `${split.user.name}: ${split.amountOwed.toFixed(2)} ${expense.currency}`).join('\n'),
      expense.isPaid ? 'Tak' : 'Nie'
    ]);

    return [headers, ...rows];
  }
}
