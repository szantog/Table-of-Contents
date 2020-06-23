CKEDITOR.plugins.add('contents', {
    requires: 'widget',

    icons: 'contents',

    init: function (editor) {
        editor.addContentsCss(this.path + 'styles/styles.css');
        CKEDITOR.dialog.add('contents', this.path + 'dialogs/contents.js');

        // Default Config
        var defaultConfig = {
            header: '<p class="toc-title">Contents</p>',
            //ol or ul
            listType: 'ol',
            headersSelector: '> h1,> h2,> h3,> h4,> h5,> h6,',
            nestedHeadersSelector: 'h1,h2,h3,h4,h5,h6,'
        };

        // Get Config
        var config = CKEDITOR.tools.extend(defaultConfig, editor.config.contents || {}, true);

        editor.widgets.add('contents', {
            button: 'Insert Table of Contents',

            template:
                '<div class="widget-toc"></div>',

            allowedContent:
                'div(!widget-toc,float-left,float-right,align-center);' +
                'p(!toc-title);',

            dialog: 'contents',

            upcast: function (element) {
                return element.name == 'div'
                    && element.hasClass('widget-toc');
            },

            init: function () {
                editor.on('saveSnapshot', function (evt) {
                    buildToc(this.element)
                }.bind(this));

                this.on('focus', function (evt) {
                    buildToc(this.element)
                }.bind(this));

                buildToc(this.element);

                if (this.element.hasClass('float-left'))
                    this.setData('align', 'float-left');
                if (this.element.hasClass('float-right'))
                    this.setData('align', 'float-right');
                if (this.element.hasClass('toc_root'))
                    this.setData('chkInsertOpt', true);
            },

            data: function () {
                this.element.removeClass('float-left');
                this.element.removeClass('float-right');
                this.element.removeClass('toc_root');
                if (this.data.align)
                    this.element.addClass(this.data.align);

                if (this.data.chkInsertOpt)
                    this.element.addClass('toc_root');
            },
        });

        function buildToc(element) {

            element.setHtml(config.header);

            Container = new CKEDITOR.dom.element(config.listType);
            Container.appendTo(element);

            if (element.hasClass('toc_root')) {
                findRoot = config.headersSelector;
            } else {
                findRoot = config.nestedHeadersSelector;
            }

            var headings = editor.editable().find(findRoot),
                parentLevel = 1,
                length = headings.count();

            //get each heading
            for (var i = 0; i < length; ++i) {

                var currentHeading = headings.getItem(i),
                    text = currentHeading.getText(),
                    newLevel = parseInt(currentHeading.getName().substr(1, 1));
                var diff = (newLevel - parentLevel);

                //set the start level in case it is not h1
                if (i === 0) {
                    diff = 0;
                    parentLevel = newLevel;
                }

                //we need a new ul if the new level has a higher number than its parents number
                if (diff > 0) {
                    var containerLiNode = Container.getLast();
                    var ulNode = new CKEDITOR.dom.element(config.listType);
                    ulNode.appendTo(containerLiNode);
                    Container = ulNode;
                    parentLevel = newLevel;
                }

                //we need to get a previous ul if the new level has a lower number than its parents number
                if (diff < 0) {
                    while (0 !== diff++) {
                        parent = Container.getParent().getParent();
                        Container = (parent.getName() === config.listType ? parent : Container);
                    }
                    parentLevel = newLevel;
                }

                if (text == null || text.trim() === '') {
                    text = '&nbsp;'
                }

                var id = text.replace(/[^A-Za-z0-9_\-]+/g, '+');
                currentHeading.setAttribute('id', id);

                var liNode = CKEDITOR.dom.element.createFromHtml('<li><a href="#' + id + '">' + text + '</a></li>');

                liNode.appendTo(Container);
            }
        }
    }
});