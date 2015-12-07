function listPage(options) {
    var defaults = {
        submitBtn: '#submit',
        paginationType: 'complex', // complex  simple
        url: '',
        tableWrap: '.table-wrap',
        ajaxDataField: 'table_data',
        totalPage:$('input[name=total_page]').val(),
        pageSize: 10
    };
    /*
     showCheckbox: true,//是否显示checkbox列 默认true
     showRowIndex: false,//是否显示行号 默认true
     rowIndexStart: 1,//行号开始值 默认1
     columns: [],//各列的配置信息 默认[]
     tableData: [],//表格初始化数据
     operation: '',
     operationWidth: 100


     currentPage: 12,    // 当前页 默认 1
     totalPage: 108,     // 总页数 默认 1
     firstCount: 1,      // 1 ... 3 4 5 ... 108首页处预览页数 默认 1
     lastCount: 1,       // 1 ... 3 4 5 ... 108尾页处预览页数 默认 1
     prevCount: 2,       // 当前页前预览页数 默认 2
     nextCount: 6,       // 当前页后预览页数 默认 6
     */
    options = $.extend({}, defaults, options);
    var $tableWrap = $(options.tableWrap);
    var $submitBtn = $(options.submitBtn);
    var $searchForm = $('.search-bar form');
    var $toolBarBottom = $('.tool-bar-bottom');
    // 初始化分页
    $searchForm.append('<input type="hidden" name ="current_page" value = "1"/>');
    if (options.paginationType == 'complex') {
        $toolBarBottom.append('<div class="clear"></div>')
        var $paginationContainer = $('<div class="pull-left"></div>');
        $toolBarBottom.prepend($paginationContainer);
        options.clickCallBack = function (pageNum, $element) {
            $searchForm.find('input[name=current_page]').val(pageNum);
            loadDataByAjax.call($element, {
                beforeSend: function (XMLHttpRequest) {

                },
                success: function (data, textStatus) {

                },
                complete: function (XMLHttpRequest, textStatus) {

                }
            });
        };
        $paginationContainer.wPage(options);
    } else if (options.paginationType == 'simple') {
        var $preCursor = $('input[name=pre_cursor]');
        var $nextCursor = $('input[name=next_cursor]');
        var preDisabled = $preCursor.val() == 0 ? 'disabled' : '';
        var nextDisabled = $nextCursor.val() == 0 ? 'disabled' : '';
        var $preBtn = $('<div class="btn btn-default btn-ms pre ' + preDisabled + '">上一页</div>');
        var $nextBtn = $('<div class="btn btn-default btn-ms next ' + nextDisabled + '">下一页</div>');
        $toolBarBottom.prepend($nextBtn);
        $toolBarBottom.prepend($preBtn);
        $preBtn.on('click', function () {
            if ($(this).hasClass('disabled')) return false;
            $('input[name=mark]').val('pre');
            loadDataByAjax.call(this);
        });
        $nextBtn.on('click', function () {
            if ($(this).hasClass('disabled')) return false;
            $('input[name=mark]').val('next');
            loadDataByAjax.call(this);
        });

    } else {
        $toolBarBottom.append('<div class="clear"></div>')
    }
    //计算表格高度
    computeTableHeight();
    //初始化表格
    $(".table-wrap").wTable(options);

    $(window).on('resize', function () {
        computeTableHeight();
    });
    //查询按钮事件
    $submitBtn.not('.disabled').on('click', function (e) {
        $searchForm.find('input[name=current_page]').val(1);
        $searchForm.find('input[name=pre_cursor]').val(0);
        $searchForm.find('input[name=next_cursor]').val(0);
        $searchForm.find('input[name=mark]').val('search');
        loadDataByAjax.call(this)
    });
    $searchForm.find('input').on('keydown',function(e){
        if(e.keyCode == 13){
            $submitBtn.trigger('click');
            return false;
        }
    });

    function computeTableHeight() {
        // table-wrap 上面可以有任意东西，通过offset().top计算上面整体高度，底部内容需要单独计算
        var windowHeight = $(window).height();
        var bottomHeight = $('.tool-bar-bottom').outerHeight();
        $tableWrap.height(windowHeight - $tableWrap.offset().top - bottomHeight - 3);
    }
    // ajax 载入数据
    function loadDataByAjax(opt) {
        if (!opt) opt = {};
        var formData = $('.search-bar form').serializeArray();
        var $this = $(this);
        $.ajax({
            method: 'GET',
            dataType: 'json',
            data: formData,
            url: options.url,
            beforeSend: function (XMLHttpRequest) {
                $.showPreloader();
                $this.addClass('disabled');
                if (opt.beforeSend) opt.beforeSend(XMLHttpRequest);
            },
            success: function (data, textStatus) {
                if (opt.success) opt.success(data, textStatus);
                if (options.paginationType == 'simple') {
                    $preCursor.val(data.pre_cursor);
                    $nextCursor.val(data.next_cursor);
                    var mark = $('input[name=mark]').val();
                    var $currentPage = $searchForm.find('input[name=current_page]');
                    var pageNum = $currentPage.val();
                    if (mark == 'next') {
                        $currentPage.val(++pageNum);
                    } else if(mark=='pre') {
                        $currentPage.val(--pageNum);
                    }
                }
                if (options.paginationType == 'complex') {
                    $paginationContainer.wPage('setCurrentPage', data.current_page);
                    $paginationContainer.wPage('setTotalPage', data.total_page);
                }
                var indexStart = options.pageSize * ($('input[name=current_page]').val() - 1) + 1;
                $tableWrap.wTable('load', data[options.ajaxDataField], indexStart);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                alert(XMLHttpRequest.status+'：'+XMLHttpRequest.statusText);
            },
            complete: function (XMLHttpRequest, textStatus) {
                $.hidePreloader();
                $this.removeClass('disabled');
                if (options.paginationType == 'simple') {
                    var preCursor = $('input[name=pre_cursor]').val();
                    var nextCursor = $('input[name=next_cursor]').val();
                    if (preCursor == 0) {
                        $preBtn.addClass('disabled');
                    } else {
                        $preBtn.removeClass('disabled');
                    }
                    if (nextCursor == 0) {
                        $nextBtn.addClass('disabled');
                    } else {
                        $nextBtn.removeClass('disabled');
                    }
                }
                if (opt.complete) opt.complete(XMLHttpRequest, textStatus);
            }
        });
    }
    return $tableWrap;
}