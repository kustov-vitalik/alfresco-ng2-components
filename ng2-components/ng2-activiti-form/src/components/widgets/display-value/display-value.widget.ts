/*!
 * @license
 * Copyright 2016 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, OnInit } from '@angular/core';
import { WidgetComponent } from './../widget.component';
import { FormFieldTypes } from '../core/form-field-types';
import { FormService } from '../../../services/form.service';
import { FormFieldOption } from './../core/form-field-option';
import { DynamicTableColumn } from './../core/dynamic-table-column';
import { DynamicTableRow } from './../core/dynamic-table-row';

@Component({
    moduleId: module.id,
    selector: 'display-value-widget',
    templateUrl: './display-value.widget.html',
    styleUrls: ['./display-value.widget.css']
})
export class DisplayValueWidget extends WidgetComponent implements OnInit {

    value: any;
    fieldType: string;

    // hyperlink
    linkUrl: string;
    linkText: string;

    // dynamic table
    rows: DynamicTableRow[] = [];
    columns: DynamicTableColumn[] = [];
    visibleColumns: DynamicTableColumn[] = [];

    // upload/attach
    hasFile: boolean = false;

    constructor(private formService: FormService) {
        super();
    }

    ngOnInit() {
        if (this.field) {
            this.value = this.field.value;

            if (this.field.params) {
                let originalField = this.field.params['field'];
                if (originalField && originalField.type) {
                    this.fieldType = originalField.type;
                    switch (originalField.type) {
                        case FormFieldTypes.BOOLEAN:
                            this.value = this.field.value === 'true' ? true : false;
                            break;
                        case FormFieldTypes.FUNCTIONAL_GROUP:
                            if (this.field.value) {
                                this.value = this.field.value.name;
                            } else {
                                this.value = null;
                            }
                            break;
                        case FormFieldTypes.PEOPLE:
                            let model = this.field.value;
                            if (model) {
                                let displayName = `${model.firstName} ${model.lastName}`;
                                this.value = displayName.trim();
                            }
                            break;
                        case FormFieldTypes.UPLOAD:
                            let files = this.field.value || [];
                            if (files.length > 0) {
                                this.value = decodeURI(files[0].name);
                                this.hasFile = true;
                            } else {
                                this.value = null;
                                this.hasFile = false;
                            }
                            break;
                        case FormFieldTypes.TYPEAHEAD:
                            this.loadRestFieldValue();
                            break;
                        case FormFieldTypes.DROPDOWN:
                            this.loadRestFieldValue();
                            break;
                        case FormFieldTypes.RADIO_BUTTONS:
                            if (this.field.restUrl) {
                                this.loadRestFieldValue();
                            } else {
                                this.loadRadioButtonValue();
                            }
                            break;
                        case FormFieldTypes.DATE:
                            if (this.value) {
                                let d = moment(this.value.split('T')[0], 'YYYY-M-D');
                                if (d.isValid()) {
                                    this.value = d.format('D-M-YYYY');
                                }
                            }
                            break;
                        case FormFieldTypes.AMOUNT:
                            if (this.value) {
                                let currency = this.field.currency || '$';
                                this.value = `${currency} ${this.field.value}`;
                            }
                            break;
                        case FormFieldTypes.HYPERLINK:
                            this.linkUrl = this.getHyperlinkUrl(this.field);
                            this.linkText = this.getHyperlinkText(this.field);
                            break;
                        case FormFieldTypes.DYNAMIC_TABLE:
                            let json = this.field.json;
                            if (json.columnDefinitions) {
                                this.columns = json.columnDefinitions.map(obj => <DynamicTableColumn> obj);
                                this.visibleColumns = this.columns.filter(col => col.visible);
                            }
                            if (json.value) {
                                this.rows = json.value.map(obj => <DynamicTableRow> {selected: false, value: obj});
                            }
                            break;
                        default:
                            this.value = this.field.value;
                            break;
                    }
                }
            }
        }
    }

    loadRadioButtonValue() {
        let options = this.field.options || [];
        let toSelect = options.find(item => item.id === this.field.value);
        if (toSelect) {
            this.value = toSelect.name;
        } else {
            this.value = this.field.value;
        }
    }

    loadRestFieldValue() {
        if (this.field.form.processDefinitionId) {
            this.getValuesByProcessDefinitionId();
        } else {
            this.getValuesByTaskId();
        }
    }

    getValuesByProcessDefinitionId() {
        this.formService
            .getRestFieldValuesByProcessId(
                this.field.form.processDefinitionId,
                this.field.id
            )
            .subscribe(
                (result: FormFieldOption[]) => {
                    let options = result || [];
                    let toSelect = options.find(item => item.id === this.field.value);
                    if (toSelect) {
                        this.value = toSelect.name;
                    } else {
                        this.value = this.field.value;
                    }
                },
                error => {
                    console.log(error);
                    this.value = this.field.value;
                }
            );
    }

    getValuesByTaskId() {
        this.formService
            .getRestFieldValues(this.field.form.taskId, this.field.id)
            .subscribe(
                (result: FormFieldOption[]) => {
                    let options = result || [];
                    let toSelect = options.find(item => item.id === this.field.value);
                    if (toSelect) {
                        this.value = toSelect.name;
                    } else {
                        this.value = this.field.value;
                    }
                },
                error => {
                    console.log(error);
                    this.value = this.field.value;
                }
            );
    }

    getCellValue(row: DynamicTableRow, column: DynamicTableColumn): any {
        let result = row.value[column.id];

        if (column.type === 'Dropdown') {
            if (result) {
                return result.name;
            }
        }

        if (column.type === 'Boolean') {
            return result ? true : false;
        }

        if (column.type === 'Date') {
            if (result) {
                return moment(result.split('T')[0], 'YYYY-MM-DD').format('D-M-YYYY');
            }
        }

        if (column.type === 'Amount') {
            return (column.amountCurrency || '$') + ' ' + (result || 0);
        }

        return result || '';
    }
}
