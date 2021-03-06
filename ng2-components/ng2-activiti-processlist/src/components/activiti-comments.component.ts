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

import { Component, Input, OnInit, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { AlfrescoTranslationService } from 'ng2-alfresco-core';
import { ActivitiProcessService } from './../services/activiti-process.service';
import { Comment } from 'ng2-activiti-tasklist';
import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';

declare let componentHandler: any;

@Component({
    selector: 'activiti-process-instance-comments',
    moduleId: module.id,
    templateUrl: './activiti-comments.component.html',
    styleUrls: ['./activiti-comments.component.css'],
    providers: [ActivitiProcessService]
})
export class ActivitiComments implements OnInit, OnChanges {

    @Input()
    processInstanceId: string;

    @ViewChild('dialog')
    dialog: any;

    comments: Comment [] = [];

    private commentObserver: Observer<Comment>;
    comment$: Observable<Comment>;

    message: string;

    /**
     * Constructor
     * @param auth
     * @param translate
     */
    constructor(private translate: AlfrescoTranslationService,
                private activitiProcess: ActivitiProcessService) {

        if (translate) {
            translate.addTranslationFolder('node_modules/ng2-activiti-processlist/src');
        }

        this.comment$ = new Observable<Comment>(observer =>  this.commentObserver = observer).share();

    }

    ngOnInit() {
        this.comment$.subscribe((comment: Comment) => {
            this.comments.push(comment);
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        let processInstanceId = changes['processInstanceId'];
        if (processInstanceId && processInstanceId.currentValue) {
            this.getProcessComments(processInstanceId.currentValue);
            return;
        }
    }

    public getProcessComments(processInstanceId: string) {
        this.comments = [];
        if (processInstanceId) {
            this.activitiProcess.getProcessInstanceComments(processInstanceId).subscribe(
                (res: Comment[]) => {
                    res.forEach((comment) => {
                        this.commentObserver.next(comment);
                    });
                },
                (err) => {
                    console.log(err);
                }
            );
        } else {
            this.comments = [];
        }
    }

    public showDialog() {
        if (this.dialog) {
            this.dialog.nativeElement.showModal();
        }
    }

    public add() {
        this.activitiProcess.addProcessInstanceComment(this.processInstanceId, this.message).subscribe(
            (res: Comment) => {
                this.comments.push(res);
                this.message = '';
            },
            (err) => {
                console.log(err);
            }
        );
        this.cancel();
    }

    public cancel() {
        if (this.dialog) {
            this.dialog.nativeElement.close();
        }
    }
}
