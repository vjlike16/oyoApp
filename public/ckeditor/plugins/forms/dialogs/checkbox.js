/*
 Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md or http://ckeditor.com/license
*/
CKEDITOR.dialog.add("checkbox", function(d) {
    return {
        title: d.lang.forms.checkboxAndRadio.checkboxTitle,
        minWidth: 350,
        minHeight: 140,
        onShow: function() {
            delete this.checkbox;
            var a = this.getParentEditor().getSelection().getSelectedElement();
            a && "checkbox" == a.getAttribute("type") && (this.checkbox = a, this.setupContent(a))
        },
        onOk: function() {
				var a, b, z = this.checkbox;
				b || (a = this.getParentEditor(), b = a.document.createElement("input"), b.setAttribute("type", "checkbox"));
				
				z = a.document.createElement("label");
				z.append(b);
				
				a.insertElement(z);
				this.commitContent({
					element: z
				}) 
				

        },
        contents: [{
            id: "info",
            label: d.lang.forms.checkboxAndRadio.checkboxTitle,
            title: d.lang.forms.checkboxAndRadio.checkboxTitle,
            startupFocus: "txtName",
            elements: [{
                id: "txtName",
                type: "text",
                label: d.lang.common.name,
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
                id: "txtValue",
                type: "text",
                label: d.lang.forms.checkboxAndRadio.value,
                "default": "",
                accessKey: "V",
                setup: function(a) {
                    a = a.getAttribute("value");
                    this.setValue(CKEDITOR.env.ie && "on" == a ? "" : a)
                },
                commit: function(a) {
                    var b = a.element,
                        c = this.getValue();
                    !c || CKEDITOR.env.ie && "on" == c ? CKEDITOR.env.ie ? (c = new CKEDITOR.dom.element("input", b.getDocument()), b.copyAttributes(c, {
                        value: 1
                    }), c.replace(b), d.getSelection().selectElement(c), a.element = c) : b.removeAttribute("value") : b.setAttribute("value", c)
					
					var z;
					z = b.append('span');
					z = z.setHtml(this.getValue());
					//z = z.appendText(this.getValue());
                }
            }]
        }]
    }
});