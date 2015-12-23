/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var App = require('app');

App.FileController = Ember.ObjectController.extend({
  needs:['files'],
  actions:{
    confirmPreview:function (file) {
      this.downloadFile(file, "browse");
    },
    download:function (option) {
      this.downloadFile(this.get('content'), option);
    },
    preview:function (option) {
      this.send('showPreviewModal',this.get('content'));
    },
    showChmod:function () {
      this.send('showChmodModal',this.get('content'));
    },
    rename:function (opt,name) {
      var file = this.get('content'),
          path = file.get('path'),
          newPath;

      if (name === file.get('name') || Em.isEmpty(name)) {
        return this.set('isRenaming',!Em.isEmpty(name));
      }

      newPath = path.substring(0,path.lastIndexOf('/')+1)+name;

      this.store.move(file,newPath)
        .then(Em.run.bind(this,this.set,'isRenaming',false),Em.run.bind(this,this.sendAlert));
    },
    editName:function () {
      this.set('isRenaming',true);
    },
    open:function (file) {
      if (this.get('content.isDirectory')) {
        return this.transitionToRoute('files',{queryParams: {path: this.get('content.id')}});
      } else{
        //return this.send('download');
        return this.send('preview');
      }
    },
    deleteFile:function (deleteForever) {
      this.store
        .remove(this.get('content'),!deleteForever)
        .then(null,Em.run.bind(this,this.deleteErrorCallback,this.get('content')));
    }
  },
  selected:false,
  isRenaming:false,
  isMovingToTrash:false,
  chmodVisible:false,
  targetContextMenu:null,
  isPermissionsDirty:function () {
    var file = this.get('content');
    var diff = file.changedAttributes();
    return !!diff.permission;
  }.property('content.permission'),
  isMoving:function () {
    var movingFile = this.get('parentController.movingFile.path');
    var thisFile = this.get('content.id');
    return movingFile === thisFile;
  }.property('parentController.movingFile'),

  setSelected:function (controller,observer) {
    this.set('selected',this.get(observer));
  }.observes('content.selected'),

  renameSuccessCallback:function (record,error) {
    record.rollback();
    this.sendAlert(error);
  },

  dirInfo: Em.computed.alias('controllers.files.content.meta'),

  deleteErrorCallback:function (record,error) {
    this.get('parentController.model').pushRecord(record);
    this.send('showAlert',error);
  },

  sendAlert:function (error) {
    this.send('showAlert',error);
  },
  downloadFile: function(files, option) {
    var _this = this;
    this.store.linkFor([files], option, false, true).then(function(link) {
      var that = _this;
      Ember.$.get(link).done(function(data) {
        if(data.allowed) {
          that.store.linkFor([files],option).then(function (link) {
            window.location.href = link;
          },Em.run.bind(that,that.sendAlert));
        }
      }).fail(function(jqXHR, textStatus, errorThrown) {
        that.send('showAlert', jqXHR);
      });
    }, Em.run.bind(this,this.sendAlert));
  }
});
