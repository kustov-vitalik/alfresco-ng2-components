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
import { AlfrescoAuthenticationService, AlfrescoSettingsService } from 'ng2-alfresco-core';
import { Observable } from 'rxjs/Rx';
import { Response, Http, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import { ReportParametersModel, ParameterValueModel } from '../models/report.model';
import { Chart, PieChart, TableChart, BarChart, HeatMapChart, MultiBarChart } from '../models/chart.model';

@Injectable()
export class AnalyticsService {

    constructor(private authService: AlfrescoAuthenticationService,
                private http: Http,
                private alfrescoSettingsService: AlfrescoSettingsService) {
    }

    /**
     * Retrive all the Deployed app
     * @returns {Observable<any>}
     */
    getReportList(): Observable<any> {
        let url = `${this.alfrescoSettingsService.getBPMApiBaseUrl()}/app/rest/reporting/reports`;
        let options = this.getRequestOptions();
        return this.http
            .get(url, options)
            .map((res: any) => {
                let reports: ReportParametersModel[] = [];
                let body = res.json();
                body.forEach((report: ReportParametersModel) => {
                    let reportModel = new ReportParametersModel(report);
                    reports.push(reportModel);
                });
                return reports;
            }).catch(this.handleError);
    }

    getReportParams(reportId: string): Observable<any> {
        let url = `${this.alfrescoSettingsService.getBPMApiBaseUrl()}/app/rest/reporting/report-params/${reportId}`;
        let options = this.getRequestOptions();
        return this.http
            .get(url, options)
            .map((res: any) => {
                let body = res.json();
                return new ReportParametersModel(body);
            }).catch(this.handleError);
    }

    getParamValuesByType(type: string, appId: string, reportId?: string, processDefinitionId?: string) {
        if (type === 'status') {
            return this.getProcessStatusValues();
        } else if (type === 'processDefinition') {
            if (appId === null || appId === undefined) {
                return this.getProcessDefinitionsValuesNoApp();
            } else {
                return this.getProcessDefinitionsValues(appId);
            }
        } else if (type === 'dateInterval') {
            return this.getDateIntervalValues();
        } else if (type === 'task') {
            return this.getTasksByProcessDefinitionId(reportId, processDefinitionId);
        } else {
            return Observable.create(observer => {
                observer.next(null);
                observer.complete();
            });
        }
    }

    getProcessStatusValues(): Observable<any> {
        let paramOptions: ParameterValueModel[] = [];

        paramOptions.push(new ParameterValueModel({ id: 'All', name: 'All' }));
        paramOptions.push(new ParameterValueModel({ id: 'Active', name: 'Active' }));
        paramOptions.push(new ParameterValueModel({ id: 'Complete', name: 'Complete' }));

        return Observable.create(observer => {
            observer.next(paramOptions);
            observer.complete();
        });
    }

    getDateIntervalValues(): Observable<any> {
        let paramOptions: ParameterValueModel[] = [];

        paramOptions.push(new ParameterValueModel({ id: 'byHour', name: 'By hour' }));
        paramOptions.push(new ParameterValueModel({ id: 'byDay', name: 'By day' }));
        paramOptions.push(new ParameterValueModel({ id: 'byWeek', name: 'By week' }));
        paramOptions.push(new ParameterValueModel({ id: 'byMonth', name: 'By month' }));
        paramOptions.push(new ParameterValueModel({ id: 'byYear', name: 'By year' }));

        return Observable.create(observer => {
            observer.next(paramOptions);
            observer.complete();
        });
    }

    getMetricValues(): Observable<any> {
        let paramOptions: ParameterValueModel[] = [];

        paramOptions.push(new ParameterValueModel({ id: 'totalCount', name: 'Number of times a step is executed' }));
        paramOptions.push(new ParameterValueModel({ id: 'totalTime', name: 'Total time spent in a process step' }));
        paramOptions.push(new ParameterValueModel({ id: 'avgTime', name: 'Average time spent in a process step' }));

        return Observable.create(observer => {
            observer.next(paramOptions);
            observer.complete();
        });
    }

    getProcessDefinitionsValuesNoApp(): Observable<any> {
        let url = `${this.alfrescoSettingsService.getBPMApiBaseUrl()}/app/rest/reporting/process-definitions`;
        let options = this.getRequestOptions();
        return this.http
            .get(url, options)
            .map((res: any) => {
                let paramOptions: ParameterValueModel[] = [];
                let body = res.json();
                body.forEach((opt) => {
                    paramOptions.push(new ParameterValueModel(opt));
                });
                return paramOptions;
            }).catch(this.handleError);
    }

    getProcessDefinitionsValues(appId: string): Observable<any> {
        let url = `${this.alfrescoSettingsService.getBPMApiBaseUrl()}/app/rest/process-definitions`;
        let params: URLSearchParams;
        params = new URLSearchParams();
        params.set('appDefinitionId', appId);
        let options = this.getRequestOptions(params);
        return this.http
            .get(url, options)
            .map((res: any) => {
                let paramOptions: ParameterValueModel[] = [];
                let body = res.json();
                body.data.forEach((opt) => {
                    paramOptions.push(new ParameterValueModel(opt));
                });
                return paramOptions;
            }).catch(this.handleError);
    }

    getTasksByProcessDefinitionId(reportId: string, processDefinitionId: string): Observable<any> {
        if (reportId && processDefinitionId) {
            let url = `${this.alfrescoSettingsService.getBPMApiBaseUrl()}/app/rest/reporting/report-params/${reportId}/tasks`;
            let params: URLSearchParams;
            if (processDefinitionId) {
                params = new URLSearchParams();
                params.set('processDefinitionId', processDefinitionId);
            }
            let options = this.getRequestOptions(params);
            return this.http
                .get(url, options)
                .map((res: any) => {
                    let paramOptions: ParameterValueModel[] = [];
                    let body = res.json();
                    body.forEach((opt) => {
                        paramOptions.push(new ParameterValueModel({ id: opt, name: opt }));
                    });
                    return paramOptions;
                }).catch(this.handleError);
        } else {
            return Observable.create(observer => {
                observer.next(null);
                observer.complete();
            });
        }
    }

    getReportsByParams(reportId: number, paramsQuery: any): Observable<any> {
        let url = `${this.alfrescoSettingsService.getBPMApiBaseUrl()}/app/rest/reporting/report-params/${reportId}`;
        let body = paramsQuery ? JSON.stringify(paramsQuery) : {};
        let options = this.getRequestOptions();
        return this.http
            .post(url, body, options)
            .map((res: any) => {
                let elements: Chart[] = [];
                let bodyRes = res.json();
                bodyRes.elements.forEach((chartData) => {
                    if (chartData.type === 'pieChart') {
                        elements.push(new PieChart(chartData));
                    } else if (chartData.type === 'table') {
                        elements.push(new TableChart(chartData));
                    } else if (chartData.type === 'processDefinitionHeatMap') {
                        elements.push(new HeatMapChart(chartData));
                    } else if (chartData.type === 'masterDetailTable') {
                        elements.push(new TableChart(chartData));
                    } else if (chartData.type === 'barChart') {
                        elements.push(new BarChart(chartData));
                    } else if (chartData.type === 'multiBarChart') {
                        elements.push(new MultiBarChart(chartData));
                    }
                });

                return elements;
            }).catch(this.handleError);
    }

    public createDefaultReports(): Observable<any> {
        let url = `${this.alfrescoSettingsService.getBPMApiBaseUrl()}/app/rest/reporting/default-reports`;
        let options = this.getRequestOptions();
        let body = {};
        return this.http
            .post(url, body, options)
            .map((res: any) => {
                return res;
            }).catch(this.handleError);
    }

    public getHeaders(): Headers {
        return new Headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': this.authService.getTicketBpm()
        });
    }

    public getRequestOptions(param?: any): RequestOptions {
        let headers = this.getHeaders();
        return new RequestOptions({ headers: headers, withCredentials: true, search: param });
    }

    private handleError(error: Response) {
        console.error(error);
        return Observable.throw(error.json().error || 'Server error');
    }
}
