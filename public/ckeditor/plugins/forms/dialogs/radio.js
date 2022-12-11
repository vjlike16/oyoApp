CKEDITOR.dialog.add("radio", function(b) {
    return {
        title: b.lang.forms.checkboxAndRadio.radioTitle,
        minWidth: 350,
        minHeight: 140,
        onShow: function() {
            delete this.radioButton;
            var a = this.getParentEditor().getSelection().getSelectedElement();
            a && "input" == a.getName() && "radio" == a.getAttribute("type") && (this.radioButton = a, this.setupContent(a))
        },
        onOk: function() {
			var editor,
						element = this.radioButton,
						element1 = this.radioButton,
						isInsertMode = !element;

						if ( isInsertMode )
						{
							editor = this.getParentEditor();
							element1 = editor.document.createElement( 'input' );
							element1.setAttribute( 'type', 'radio' );
							
							element = editor.document.createElement( 'label' );
							element.append(element1)
						}

						if ( isInsertMode )
							editor.insertElement( element );
							this.commitContent( { element : element } );
        },
        contents: [{
            id: "info",
            label: b.lang.forms.checkboxAndRadio.radioTitle,
            title: b.lang.forms.checkboxAndRadio.radioTitle,
            elements: [{
                id: "name",
                type: "text",
                label: b.lang.common.name,
                "default": "",
                accessKey: "N",
                setup: function(a) {
                    this.setValue(a.data("cke-saved-name") || a.getAttribute("name") || "")
                },
                commit: function(a) {
                    a = a.element;
					var input = a.getFirst();
					var nameValue = this.getValue();
					
					this.getValue() ? a.data("cke-saved-name", this.getValue()) : (a.data("cke-saved-name", !1), a.removeAttribute("name"));
					
					this.getValue() ? input.data("cke-saved-name", this.getValue()) : (input.data("cke-saved-name", !1), input.removeAttribute("name"));
					
				}
            }, {
                id: "value",
                type: "text",
                label: b.lang.forms.checkboxAndRadio.value,
                "default": "",
                accessKey: "V",
                setup: function(a) {
					    this.setValue(a.getAttribute("value") || "");
				},
                commit: function(a) {
						//var attrName = a.getNameAtt;
						a = a.element;
						var input = a.getFirst();
						var valueData = this.getValue();
						
						this.getValue() ? a.setAttribute("value", this.getValue()) : a.removeAttribute("value");
						
						this.getValue() ? input.setAttribute("value", this.getValue()) : input.removeAttribute("value");
						
						
						var z;
						z = a.append('span');
						z.setHtml(valueData);
						
						
						//console.dir("==========="+span);
				}
            }]
        }]
    }
});