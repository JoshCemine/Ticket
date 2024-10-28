import { HttpClient, HttpParams, HttpClientModule } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DxDataGridComponent, DxDataGridModule } from 'devextreme-angular';
import { LoadOptions } from 'devextreme/data';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';

import dxCheckBox, {
  InitializedEvent,
} from 'devextreme/ui/check_box';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DxDataGridModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = "DevExtreme"

  @ViewChild(DxDataGridComponent, { static: false }) dataGrid!: DxDataGridComponent; //Gets the datagrid component
  selectAllCheckBox!: dxCheckBox; //Gets the checkbox component
  DISABLED_ITEMS = [35703, 35711, 35714, 38466, 38775]; //Example disabled items

  dataSource = {} as CustomStore;

  constructor(httpClient: HttpClient) {
    const isNotEmpty = (value: unknown) => (value !== undefined && value !== null && value !== '');
    this.dataSource = new CustomStore({
      key: 'OrderNumber',
      async load(loadOptions: LoadOptions) {
        const url = 'https://js.devexpress.com/Demos/WidgetsGalleryDataService/api/orders';

        const paramNames = [
          'skip', 'take', 'requireTotalCount', 'requireGroupCount',
          'sort', 'filter', 'totalSummary', 'group', 'groupSummary',
        ];

        let params = new HttpParams();

        paramNames
          .filter((paramName) => isNotEmpty((loadOptions as Record<string, unknown>)[paramName]))
          .forEach((paramName) => {
            params = params.set(paramName, JSON.stringify((loadOptions as Record<string, unknown>)[paramName]));
          });

        try {
          const result = await lastValueFrom(httpClient.get(url, { params })) as Record<string, unknown>;

          return {
            data: result['data'],
            totalCount: result['totalCount'],
            summary: result['summary'],
            groupCount: result['groupCount'],
          };
        } catch (err) {
          throw new Error('Data Loading Error');
        }
      },
    });

    this.onEditorPreparing = this.onEditorPreparing.bind(this)
    this.onSelectionChanged = this.onSelectionChanged.bind(this)
  }


  onContentReady(e: any) {
    //When a new page is loaded and becomes ready, it updates the checkbox value here
    this.selectAllCheckBox.option("value", this.isSelectAll())
  }
  getSelectableItems() {
    return this.dataGrid.instance.getVisibleRows().filter(item => !this.DISABLED_ITEMS.includes(item.key))
  }
  isSelectable(item: any) {
    return this.DISABLED_ITEMS.includes(item.OrderNumber)
  }

  disableRows() {
    //In this instance this function checks each selected row data. 
    //If any of them are supposed to be deselected it deselects the data
    const deselectRowKeys: number[] = [];
    const dataGrid = this.dataGrid.instance

    dataGrid.getSelectedRowsData().forEach((item: any) => {
      if (this.isSelectable(item))
        deselectRowKeys.push(dataGrid.keyOf(item));
    });

    if (deselectRowKeys.length) {
      dataGrid.deselectRows(deselectRowKeys);
    }
  }

  isSelectAll() {
    //This function gets all the selected rows and the rows on the current page.
    //It then filters to see which of these rows are not disabled.
    //Then compares it with the number of selected rows on the current page that are not disabled.
    //The result of this is then made into the value of the selectAllCheckbox
    const selectedRowKeys = this.dataGrid.instance.getSelectedRowKeys()
    const visibleKeys = this.dataGrid.instance.getVisibleRows().map(item => item.key)

    const currentSelectableKeys = selectedRowKeys.filter(item => visibleKeys.includes(item))
    const selectableItems = this.getSelectableItems()

    if (!currentSelectableKeys?.length) {
      console.log("isSelectAll", "false")
      return false;
    }
    return currentSelectableKeys.length === selectableItems.length ? true : undefined;
  };

  onEditorPreparing(e: any) {
    if (e.type !== 'selection') return;

    if (e.parentType === 'dataRow' && e.row && this.isSelectable(e.row.data))
      e.editorOptions.disabled = true;

    if (e.parentType === 'headerRow') {
      console.log("HeaderRow", e)
      const dataGrid = e.component;
      e.editorOptions.value = this.isSelectAll();
      e.editorOptions.onInitialized = (e: InitializedEvent) => {
        if (e.component) {
          console.log("SLCHKBX", e.component)
          this.selectAllCheckBox = e.component;
        }
      };
    }
  }

  onSelectionChanged(e: any) {
    this.disableRows()
    this.selectAllCheckBox.option('value', this.isSelectAll());
  }
}
