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

import { Component, Input } from '@angular/core';
import { AlfrescoTranslationService } from 'ng2-alfresco-core';
import { TaskDetailsModel } from '../models/task-details.model';

@Component({
    selector: 'activiti-task-header',
    moduleId: module.id,
    templateUrl: './activiti-task-header.component.html',
    styleUrls: ['./activiti-task-header.component.css']
})
export class ActivitiTaskHeader {

    @Input()
    formName: string = null;

    @Input()
    taskDetails: TaskDetailsModel;

    constructor(private translate: AlfrescoTranslationService) {
        if (translate) {
            translate.addTranslationFolder('node_modules/ng2-activiti-tasklist/src');
        }
    }

    public hasAssignee(): boolean {
        return (this.taskDetails && this.taskDetails.assignee) ? true : false;
    }
}
