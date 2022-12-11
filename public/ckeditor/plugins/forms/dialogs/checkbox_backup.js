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
					var editor,
							element = this.checkbox,
							element1 = this.checkbox,
							isInsertMode = !element;

						if ( isInsertMode )
						{
							editor = this.getParentEditor();
							element1 = editor.document.createElement( 'input' );
							element1.setAttribute( 'type', 'checkbox' );
							
							element = editor.document.createElement( 'label' );
							element.append(element1)
						}

						if ( isInsertMode )
							editor.insertElement( element );
							this.commitContent( { element : element } );
					
					
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
								
								var z;
								z = a.append('span');
								z = z.setHtml(this.getValue());
							}
					}]
				}]
    }
});