import { HttpClient, HttpParams, HttpClientModule } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DxDataGridComponent, DxDataGridModule } from 'devextreme-angular';
import { LoadOptions } from 'devextreme/data';
import CustomStore from 'devextreme/data/custom_store';
import dxDataGrid from 'devextreme/ui/data_grid';
import { lastValueFrom } from 'rxjs';

import dxCheckBox, {
  InitializedEvent,
  ValueChangedEvent,
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

  ///
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid!: DxDataGridComponent;
  selectAllCheckBox!: dxCheckBox;
  checkBoxUpdating: boolean = false;
  DISABLED_ITEMS = [35703, 35711, 35714, 38466, 38775];
  SELECTABLE_ITEMS = []
  //url: string;

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


  //FOR DEBUG
  ngOnInit() {
    let filterArray: any = []
    this.DISABLED_ITEMS.forEach((item, i) => {
      filterArray.push(["OrderNumber", "<>", item])
      if (i < this.DISABLED_ITEMS.length - 1) {
        filterArray.push("and")
      }
    })
    // console.log(filterArray)

    this.dataSource.load({ filter: filterArray }).then((res: any) => this.SELECTABLE_ITEMS = res.data)

  }

  getSelectableItems() {
    return this.dataGrid.instance.getVisibleRows().filter(item => !this.DISABLED_ITEMS.includes(item.key))
  }

  isSelectAll(dataGrid: dxDataGrid) {
    const selectedRowKeys = dataGrid.getSelectedRowKeys()
    const selectableItems = this.getSelectableItems()

    console.log("isSelectAll: SelectedRowKeys", selectedRowKeys)
    console.log("isSelectAll: SelectableItems", selectableItems)

    if (!selectedRowKeys?.length) {
      console.log("isSelectAll", "false")
      return false;
    }
    return selectedRowKeys.length >= selectableItems.length ? true : undefined;
  };

  isSelectable(item: any) {
    return this.DISABLED_ITEMS.includes(item.OrderNumber)
  }

  onEditorPreparing(e: any) {
    if (e.type !== 'selection') return;

    if (e.parentType === 'dataRow' && e.row && this.isSelectable(e.row.data))
      e.editorOptions.disabled = true;

    if (e.parentType === 'headerRow') {
      console.log("HeaderRow", e)
      const dataGrid = e.component;
      e.editorOptions.value = this.isSelectAll(dataGrid);
      e.editorOptions.onInitialized = (e: InitializedEvent) => {
        if (e.component) {
          console.log("SLCHKBX", e.component)
          this.selectAllCheckBox = e.component;
        }
      };
      e.editorOptions.onValueChanged = (e: ValueChangedEvent) => {

        if (!e.event) {
          if (e.previousValue && !this.checkBoxUpdating) {
            e.component.option('value', e.previousValue);
          }
          return;
        }

        if (this.isSelectAll(dataGrid) === e.value) {
          return;
        }

        e.value ? dataGrid.selectAll() : dataGrid.deselectAll();
        e.event.preventDefault();
      };
    }
  }

  onSelectionChanged(e: any) {
    const deselectRowKeys: number[] = [];
    const dataGrid = e.component
    console.log("ON SELECTION CHANGED", e)
    console.log(this.selectAllCheckBox.option('value'))



    e.selectedRowsData.forEach((item: any) => {
      console.log("DSLTDRWKYS", deselectRowKeys)
      if (this.isSelectable(item))
        deselectRowKeys.push(dataGrid.keyOf(item));
    });
    if (deselectRowKeys.length) {
      console.log("DSLTDRWKYS", deselectRowKeys)
      dataGrid.deselectRows(deselectRowKeys);
    }

    console.log("WATATOP", e)
    if (this.selectAllCheckBox.option('value') === false && e.selectedRowsData === this.getSelectableItems().length) {
      this.dataGrid.instance.selectRows(e.selectedRowKeys, true)
    }

    this.checkBoxUpdating = true;
    this.selectAllCheckBox.option('value', this.isSelectAll(dataGrid));
    console.log("SLCTBXOPTNVLUE", this.selectAllCheckBox.option('value'))
    console.log(this.selectAllCheckBox.option('value'))
    this.checkBoxUpdating = false;

    console.log("WOWOWOWODJAJIDBHUASHufAGSHJFHAIUJDB")
  }
}
