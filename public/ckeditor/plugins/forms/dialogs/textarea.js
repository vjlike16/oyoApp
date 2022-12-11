/*
 Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md or http://ckeditor.com/license
*/
CKEDITOR.dialog.add("textarea", function(b) {
    return {
        title: b.lang.forms.textarea.title,
        minWidth: 350,
        minHeight: 220,
        onShow: function() {
            delete this.textarea;
            var a = this.getParentEditor().getSelection().getSelectedElement();
            a && "textarea" == a.getName() && (this.textarea = a, this.setupContent(a))
        },
        onOk: function() {
            var a, b = this.textarea,
                c = !b;
            c && (a = this.getParentEditor(), b = a.document.createElement("textarea"), b.setAttribute("fieldtype", ""));
            this.commitContent(b);
            c && a.insertElement(b)
        },
        contents: [{
            id: "info",
            label: b.lang.forms.textarea.title,
            title: b.lang.forms.textarea.title,
            elements: [{
                id: "_cke_saved_name",
                type: "text",
                label: b.lang.common.name,
                "default": "",
                accessKey: "N",
                setup: function(a) {
                    this.setValue(a.data("cke-saved-name") || a.getAttribute("name") || "")
                },
                commit: function(a) {
                    this.getValue() ? a.data("cke-saved-name", this.getValue()) : (a.data("cke-saved-name", !1), a.removeAttribute("name"))
                }
            }, {
                id: "value",
                type: "textarea",
                label: b.lang.forms.textfield.value,
                "default": "",
                setup: function(a) {
                    this.setValue(a.$.defaultValue)
                },
                commit: function(a) {
                    a.$.value = a.$.defaultValue = this.getValue()
                }
            }, {
                id: "type",
                type: "select",
                label: 'Field Type',
                "default": "petition",
                accessKey: "M",
                items: [
                    ["petition"],
                    ["respondent"]
                    
                ],
                setup: function(a) {
                    this.setValue(a.getAttribute("fieldtype"))
                },
                commit: function(a) {
                    this.getValue() ? a.setAttribute("fieldtype", this.getValue()) : a.removeAttribute("fieldtype")
                }
            }, {
                id: "audio",
                type: "checkbox",
                label: 'Audio',
                "default": "",
                accessKey: "Q",
                value: "true",
                setup: function(a) {
                    this.setValue(a.getAttribute("audio"))
                },
                commit: function(a) {
                    this.getValue() ? a.setAttribute("audio", "true") : a.removeAttribute("audio")
                }
            }]
        }]
    }
});