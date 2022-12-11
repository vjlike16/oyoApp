/*
 Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md or http://ckeditor.com/license
*/
CKEDITOR.dialog.add("textfield", function(b) {
    function e(a) {
        a = a.element;
        var b = this.getValue();
        b ? a.setAttribute(this.id, b) : a.removeAttribute(this.id)
    }

    function f(a) {
        a = a.hasAttribute(this.id) && a.getAttribute(this.id);
        this.setValue(a || "")
    }
    var g = {
        petition: 1,
        respondent: 1,
        search: 1,
        tel: 1,
        text: 1,
        url: 1
    };
    return {
        title: b.lang.forms.textfield.title,
        minWidth: 350,
        minHeight: 150,
        onShow: function() {
            delete this.textField;
            var a = this.getParentEditor().getSelection().getSelectedElement();
            !a || "input" != a.getName() || !g[a.getAttribute("type")] &&
                a.getAttribute("type") || (this.textField = a, this.setupContent(a))
        },
        onOk: function() {
            var a = this.getParentEditor(),
                b = this.textField,
                c = !b;
            c && (b = a.document.createElement("input"), b.setAttribute("type", "text"), b.setAttribute("fieldtype", ""));
            b = {
                element: b
            };
            c && a.insertElement(b.element);
            this.commitContent(b);
            c || a.getSelection().selectElement(b.element)
        },
        onLoad: function() {
            this.foreach(function(a) {
                a.getValue && (a.setup || (a.setup = f), a.commit || (a.commit = e))
            })
        },
        contents: [{
            id: "info",
            label: b.lang.forms.textfield.title,
            title: b.lang.forms.textfield.title,
            elements: [{
                type: "hbox",
                widths: ["50%", "50%"],
                children: [{
                    id: "_cke_saved_name",
                    type: "text",
                    label: b.lang.forms.textfield.name,
                    "default": "",
                    accessKey: "N",
                    setup: function(a) {
                        this.setValue(a.data("cke-saved-name") || a.getAttribute("name") || "")
                    },
                    commit: function(a) {
                        a = a.element;
                        this.getValue() ? a.data("cke-saved-name", this.getValue()) : (a.data("cke-saved-name", !1), a.removeAttribute("name"))
                    }
                }, {
                    id: "value",
                    type: "text",
                    label: b.lang.forms.textfield.value,
                    "default": "",
                    accessKey: "V",
                    commit: function(a) {
                        if (CKEDITOR.env.ie &&
                            !this.getValue()) {
                            var d = a.element,
                                c = new CKEDITOR.dom.element("input", b.document);
                            d.copyAttributes(c, {
                                value: 1
                            });
                            c.replace(d);
                            a.element = c
                        } else e.call(this, a)
                    }
                }]
            }, {
                type: "hbox",
                widths: ["50%", "50%"],
                children: [],
                onLoad: function() {
                    CKEDITOR.env.ie7Compat && this.getElement().setStyle("zoom", "100%")
                }
            }, {
                id: "type",
                type: "select",
                label: 'Field Type',
                "default": "petition",
                accessKey: "M",
                items: [
						["petition"],
						["respondent"],
						["title"],
						["facts"],
						["grounds"],
						["prayer"],
						["affidavit"],
						["list of annexures"],
						["general index"],
						["dates and events"],
						["substantial question of law"]
                ],
                setup: function(a) {
                   // this.setValue(a.getAttribute("type"));
                    this.setValue(a.getAttribute("fieldtype"))
                },
                commit: function(a) {
                    var d = a.element;
                    if (CKEDITOR.env.ie) {
                        var c = d.getAttribute("fieldtype"),
                            e = this.getValue();
                        c != e && (c = CKEDITOR.dom.element.createFromHtml('\x3cinput fieldtype\x3d"' + e + '"\x3e\x3c/input\x3e', b.document), d.copyAttributes(c, {
                            type: 1
                        }), c.replace(d), a.element = c)
                    } else d.setAttribute("fieldtype", this.getValue())
                }
            }/**, {
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
                    a = a.element;
                    this.getValue() ? a.setAttribute("audio", "true") : a.removeAttribute("audio")
                }
            }**/]
        }]
    }
});