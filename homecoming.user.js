// ==UserScript==
// @name         12306
// @version      1.0.0
// @author       tall_tree@foxmail.com
// @namespace    https://github.com/chuwenbo
// @description  12306
// @include      *://dynamic.12306.cn/otsweb/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// ==/UserScript==

function withjQuery(callback, safe) {
    //是否已经加载jquery
    if (typeof (jQuery) == "undefined") {
        var script = document.createElement("script");
        script.src = "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js";

        if (safe) {
            var cb = document.createElement("script");
            cb.type = "text/javascript";
            cb.textContent = "jQuery.noConflict();(" + callback.toString() + ")(jQuery,window);";
            script.addEventListener("load", function () {
                document.head.appendChild(cb);
            });
        }
        else {
            var dollar = undefined;
            if (typeof ($) != "undefined") dollar = $;
            script.addEventListener("load", function () {
                jQuery.noConflict();
                $ = dollar;
                callback(jQuery, window);
            });
        }
        document.head.appendChild(script);
    }
    else {//已经加载jQuery
        setTimeout(function () {
            callback(jQuery, typeof unsafeWindow == "undefined" ? window : unsafeWindow);
        }, 30);
    }
}

withjQuery(function ($, window) {
    $(document).click(function () {
        if (window.webkitNotifications && window.webkitNotifications.checkPermission() != 0) {
            window.webkitNotifications.requestPermission();
        }
    });

    function notify(str, timeout, skipAlert) {
        if (window.webkitNotifications && window.webkitNotifications.checkPermission() == 0) {
            var notification = webkitNotifications.createNotification(
                "http://www.12306.cn/mormhweb/images/favicon.cio", //iocn url
                "订票", //notification title
                str
            );
            notification.show();
            if (timeout) {
                setTimeout(function () { notification.cancel(); }, true);
            }

        } else {
            if (!skipAlert) {
                alert(str);
            }
            return false;
        }
    }

    function route(match, fn) {
        if (window.location.href.indexOf(match) != -1) {
            fn();
        }
    }

    function query() {
        var isStudentTicket = false; //是否学生票
        var isAutoQueryEnabled = false; //是否开始刷票
        var isTicketAvailable = false; //票是否有效
        var audio = null; //有票时，音乐提醒 
        var queryTimes = 0; //counter 查询次数 
        var firstRemove = false;

        //限定车次
        var $special = $("<input type='text' />")
        var $specialOnly = $("<label style='margin-left:10px;color: blue;'><input type='checkbox'  id='__chkspecialOnly'/>仅显示限定车次<label>");
        var $includeCanOder = $("<label style='margin-right:10px;color: blue;'><input type='checkbox' id='__chkIncludeCanOder'/>显示可预定车次<label>");

        //Control panel UI
        var ui = $("<div style='background-color:#CCFF99'>").append("<div>")
            .append(
            $("<label>请先选择好出发地，目的地，和出发时间。&nbsp;&nbsp;&nbsp;</label>")
        //          )
        //            .append(
        //                $("<input id='isStudentTicket' type='checkbox' />").change(function () {
        //                   isStudentTicket = this.checked;
        //              })
        //            ).append(
        //                $("<label for='isStudentTicket'></label>").html("学生票&nbsp;&nbsp;")
            ).append(
                $("<button id='refreshButton' style='padding: 5px 10px; background: #2CC03E;border-color: #259A33;border-right-color: #2CC03E;border-bottom-color:#2CC03E;color: white;border-radius: 5px;text-shadow: -1px -1px 0 rgba(0, 0, 0, 0.2);'/>")
                    .html("开始刷票").click(function () {
                        if (!isAutoQueryEnabled) {//开始刷票 
                            if (audio && !audio.paused) audio.pause(); //停止音乐
                            isTicketAvailable = false;
                            isAutoQueryEnabled = true;
                            doQuery();
                            this.innnerHTML = "停止刷票";
                        }
                        else {
                            isAutoQueryEnabled = false;
                            this.innerHTML = "开始刷票";
                        }
                    })
            ).append(
                $("<span>").html("&nbsp;&nbsp;尝试次数：").append(
                    $("<span/>").attr("id", "refreshTimes").text("0")
                )
            ).append("</div>")
            .append(
                $("<div>限定触发车次：</div>").append($special)
                    .append($specialOnly).append($includeCanOder)
                    .append("不限制不填写，限定多次用空格分割,例如: G32 G34")
            ).append("</div>");

        //注入html
        var container = $(".cx_title_w:first");
        //console.log(container);
        container.length ? ui.insertBefore(container) : ui.appendTo(document.body);

        //ticket type selector UI
        var ticketType = new Array();
        var checkbox_list = new Array();
        $(".hdr tr:eq(2) td").each(function (i, e) {
            ticketType.push(false);
            if (i < 3) return;
            ticketType[i] = true;

            //选择订票类型的checkbox
            var c = $("<input />").attr("type", "checkBox").attr("checked", true);
            c[0].ticketTypeId = i;
            console.log(c);
            c.change(function () {
                ticketType[this.ticketTypeId] = this.checked;
            }).appendTo(e);
            checkbox_list.push(c);
        });

        $.each([1, 2], function () {
            var c = checkbox_list.pop();
            c[0] = false;
            ticketType[c[0].tticketTypeId] = this.checked;
        });

        //css设置
        //$(".xhdr").parent().height(300);
        $(".objbox").css("top", "-138px"); //限制查询结果显示区域，否则添加票类型checkbox显示不全
        $("#gridbox").height(300); //设置查询显示区域高度，防止外层出现滚动条

        delete checkbox_list;

        //显示查询次数
        var displayQueryTimes = function (n) {
            document.getElementById("refreshTimes").innerHTML = n;
        };
        //Trigger the button 执行查询
        var doQuery = function () {
            firstRemove = true;
            displayQueryTimes(queryTimes++);
            document.getElementById(isStudentTicket ? "stu_submitQuery" : "submitQuery").click();
        };

        function getTimeLimitValues() {
            return $.map([$('#startTimeHFrom').val(), $('#startTimeMFrom').val(), $('#startTimeHTo').val(), $('#startTimeMTo').val()],
                function (val) { return parseInt(val) || 0; });
        }

        var checkTickets = function (row, time_limit, row_index) {
            return false;
        };

        var highLightRow = function (row) {
            $(row).css("background-color", "D1E1F1");
        }

        var onTicketAvailable = function () {
            if (window.Audio) {
                if (!audio) {
                    audio = new Audio("http://infinitinb.net/COFFdD0xMzU5MjU5MTg0Jmk9MTE4LjE4Ni44LjU0JnU9U29uZ3MvdjEvZmFpbnRRQy9mYi9kMzM0ZGYxNTA2M2YyYmZmNjNmMDcxNjgzYjY4OGNmYi5tcDMmbT1kOWExOGNlMDkyYWUyOWEwMTc0MmUwOTI0M2Q0NWM3YyZ2PWxpc3RlbiZuPb2txM9zdHlsZSZzPVBTWSUyMCZwPXM=.mp3");
                    audio.loop = true;
                }
                audio.play();
                notify("可以订票了！", null, true);
            } else {
                notify("可以订票了！");
            }
        }

        //轮询执行
        window.$ && window.$(".obj:first").ajaxComplete(function () {
            var _timeLimit = getTimeLimitValues();
            $(this).find("tr").each(function (n, e) {
                //isTicketAvailable = true;
                if (checkTickets(e, _timeLimit, n)) {
                    isTicketAvailable = true;
                    highLightRow(e);
                }
            });
            if (firstRemove) {
                firstRemove = false;
                if (isTicketAvailable) {
                    if (isAutoQueryEnabled) {
                        document.getElementById("refreshButton").click();
                    }
                    onTicketAvailable();
                }
            }
        }).ajaxError(function () {
            if (isAutoQueryEnabled) doQuery();
        });


        var _delayButton = window.delayButton;
        window.delayButton = function () {
            _delayButton();
            if (isAutoQueryEnabled) doQuery();
        }

    }

    route("querySingleAction.do", query);
    route("myOrderAction.do?method=resign", query);
    route("confirmPassengerResignAction.do?method=cancelOrderToQuery", query);

}, true);
