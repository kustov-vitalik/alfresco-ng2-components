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

import { Injectable } from '@angular/core';
import { Response, Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { AlfrescoSettingsService, AlfrescoAuthenticationService } from 'ng2-alfresco-core';
import { FormModel, FormFieldModel, TabModel } from '../components/widgets/core/index';
import { WidgetVisibilityModel } from '../models/widget-visibility.model';
import { TaskProcessVariableModel } from '../models/task-process-variable.model';

@Injectable()
export class WidgetVisibilityService {

    private processVarList: TaskProcessVariableModel[];

    constructor(private http: Http,
                private alfrescoSettingsService: AlfrescoSettingsService,
                private authService: AlfrescoAuthenticationService) {
    }

    public refreshVisibility(form: FormModel) {
        if (form && form.tabs && form.tabs.length > 0) {
            form.tabs.map(tabModel => this.refreshEntityVisibility(tabModel));
        }

        if (form) {
            form.getFormFields().map(field => this.refreshEntityVisibility(field));
        }
    }

    refreshEntityVisibility(element: FormFieldModel | TabModel) {
        element.isVisible = this.evaluateVisibility(element.form, element.visibilityCondition);
    }

    evaluateVisibility(form: FormModel, visibilityObj: WidgetVisibilityModel): boolean {
        let isLeftFieldPresent = visibilityObj && ( visibilityObj.leftFormFieldId || visibilityObj.leftRestResponseId );
        if (!isLeftFieldPresent || isLeftFieldPresent === 'null') {
            return true;
        } else {
            return this.isFieldVisible(form, visibilityObj);
        }
    }

    isFieldVisible(form: FormModel, visibilityObj: WidgetVisibilityModel): boolean {
        let leftValue = this.getLeftValue(form, visibilityObj);
        let rightValue = this.getRightValue(form, visibilityObj);
        let actualResult = this.evaluateCondition(leftValue, rightValue, visibilityObj.operator);
        if (visibilityObj.nextCondition) {
            return this.evaluateLogicalOperation(
                visibilityObj.nextConditionOperator,
                actualResult,
                this.isFieldVisible(form, visibilityObj.nextCondition)
            );
        } else {
            return actualResult;
        }
    }

    getLeftValue(form: FormModel, visibilityObj: WidgetVisibilityModel) {
        if (visibilityObj.leftRestResponseId && visibilityObj.leftRestResponseId !== 'null') {
            return this.getVariableValue(form, visibilityObj.leftRestResponseId, this.processVarList);
        }
        return this.getFormValue(form, visibilityObj.leftFormFieldId);
    }

    getRightValue(form: FormModel, visibilityObj: WidgetVisibilityModel) {
        let valueFound = '';
        if (visibilityObj.rightRestResponseId) {
            valueFound = this.getVariableValue(form, visibilityObj.rightRestResponseId, this.processVarList);
        } else if (visibilityObj.rightFormFieldId) {
            valueFound = this.getFormValue(form, visibilityObj.rightFormFieldId);
        } else {
            if (moment(visibilityObj.rightValue, 'YYYY-MM-DD', true).isValid()) {
                valueFound = visibilityObj.rightValue + 'T00:00:00.000Z';
            } else {
                valueFound = visibilityObj.rightValue;
            }
        }
        return valueFound;
    }

    getFormValue(form: FormModel, field: string) {
        let value = this.getValue(form.values, field);
        value = value && value.id ? value.id : value;
        return value ? value : this.searchForm(form, field);
    }

    getValue(values: any, fieldName: string) {
        return this.getFieldValue(values, fieldName) ||
            this.getDropDownName(values, fieldName);
    }

    getFieldValue(valueList: any, fieldName: string) {
        return valueList[fieldName];
    }

    getDropDownName(valueList: any, fieldName: string) {
        let dropDownFilterByName;
        if (fieldName && fieldName.indexOf('_LABEL') > 0) {
            dropDownFilterByName = fieldName.substring(0, fieldName.length - 6);
        }
        return ( dropDownFilterByName && valueList[dropDownFilterByName] ) ?
            valueList[dropDownFilterByName].name : dropDownFilterByName;
    }

    searchForm(form: FormModel, name: string) {
        let fieldValue = '';
        form.json.fields.forEach(columns => {
                for (let i in columns.fields) {
                    if (columns.fields.hasOwnProperty(i)) {
                        let field: any = columns.fields[i].find(field => field.id === name);
                        if (field) {
                            fieldValue = field.value;
                        }
                    }
                }
            }
        );
        return fieldValue;
    }

    getVariableValue(form: FormModel, name: string, processVarList: TaskProcessVariableModel[]) {
        return this.getFormVariableValue(form, name) ||
            this.getProcessVariableValue(name, processVarList);
    }

    private getFormVariableValue(form: FormModel, name: string) {
        if (form.json.variables) {
            let formVariable = form.json.variables.find(formVar => formVar.name === name);
            return formVariable ? formVariable.value : formVariable;
        }
    }

    private getProcessVariableValue(name: string, processVarList: TaskProcessVariableModel[]) {
        if (this.processVarList) {
            let processVariable = this.processVarList.find(variable => variable.id === name);
            return processVariable ? processVariable.value : processVariable;
        }
    }

    evaluateLogicalOperation(logicOp, previousValue, newValue): boolean {
        switch (logicOp) {
            case 'and':
                return previousValue && newValue;
            case 'or' :
                return previousValue || newValue;
            case 'and-not':
                return previousValue && !newValue;
            case 'or-not':
                return previousValue || !newValue;
            default:
                console.error('NO valid operation! wrong op request : ' + logicOp);
                break;
        }
    }

    evaluateCondition(leftValue, rightValue, operator): boolean {
        switch (operator) {
            case '==':
                return leftValue + '' === rightValue + '';
            case '<':
                return leftValue < rightValue;
            case '!=':
                return leftValue + '' !== rightValue + '';
            case '>':
                return leftValue > rightValue;
            case '>=':
                return leftValue >= rightValue;
            case '<=':
                return leftValue <= rightValue;
            case 'empty':
                return leftValue ? leftValue === '' : true;
            case '!empty':
                return leftValue ? leftValue !== '' : false;
            default:
                console.error('NO valid operation!');
                break;
        }
        return;
    }

    getTaskProcessVariable(taskId: string): Observable<TaskProcessVariableModel[]> {
        let url = `${this.alfrescoSettingsService.getBPMApiBaseUrl()}/app/rest/task-forms/${taskId}/variables`;
        let options = this.getRequestOptions();
        return this.http
            .get(url, options)
            .map((response: Response) => this.processVarList = <TaskProcessVariableModel[]> response.json())
            .catch(this.handleError);
    }

    private getHeaders(): Headers {
        return new Headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': this.authService.getTicketBpm()
        });
    }

    private getRequestOptions(): RequestOptions {
        let headers = this.getHeaders();
        return new RequestOptions({ headers: headers });
    }

    private handleError(error: Response) {
        console.error(error);
        return Observable.throw(error.json().error || 'Server error');
    }

}
