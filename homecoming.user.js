// ==UserScript==
// @name         12306
// @version      1.0.0
// @author       tall_tree@foxmail.com
// @namespace    https://github.com/chuwenbo
// @description  12306
// @include      *://dynamic.12306.cn/otsweb/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// ==UserScript==

function withjQuery(callback, safe) {
    //�Ƿ��Ѿ�����jquery
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
    else {//�Ѿ�����jQuery
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
                "��Ʊ", //notification title
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
        var isStudentTicket = false; //�Ƿ�ѧ��Ʊ
        var isAutoQueryEnabled = false; //�Ƿ�ʼˢƱ
        var isTicketAvailable = false; //Ʊ�Ƿ���Ч
        var audio = null; //��Ʊʱ���������� 
        var queryTimes = 0; //counter ��ѯ����

        //�޶�����
        var $special = $("<input type='text' />")
        var $specialOnly = $("<label style='margin-left:10px;color: blue;'><input type='checkbox'  id='__chkspecialOnly'/>����ʾ�޶�����<label>");
        var $includeCanOder = $("<label style='margin-right:10px;color: blue;'><input type='checkbox' id='__chkIncludeCanOder'/>��ʾ��Ԥ������<label>");

        //Control panel UI
        var ui = $("<div>����ѡ��ó����أ�Ŀ�ĵأ��ͳ���ʱ�䡣&nbsp;&nbsp;&nbsp;</div>")
            .append(
                $("<input id='isStudentTicket' type='checkbox' />").change(function () {
                    isStudentTicket = this.checked;
                })
            ).append(
                $("<label for='isStudentTicket'>ѧ��Ʊ</label>")
            ).append(
                $("<button id='refreshButton' style='padding: 5px 10px; background: #2CC03E;border-color: #259A33;border-right-color: #2CC03E;border-bottom-color:#2CC03E;color: white;border-radius: 5px;text-shadow: -1px -1px 0 rgba(0, 0, 0, 0.2);'/>")
                    .html("��ʼˢƱ").click(function () {
                        if (!isAutoQueryEnabled) {//��ʼˢƱ 
                            if (audio && !audio.paused) audio.pause(); //ֹͣ����
                            isTicketAvailable = false;
                            isAutoQueryEnabled = true;
                            doQuery();
                            this.innnerHTML = "ֹͣˢƱ";
                        }
                        else {
                            isAutoQueryEnabled = false;
                            this.innerHTML = "��ʼˢƱ";
                        }
                    })
            ).append(
                $("<span>").html("&nbsp;&nbsp;���Դ�����").append(
                    $("<span/>").attr("id", "refreshTimes").text("0")
                )
            ).append(
                $("<div>�޶��������Σ�</div>").append($special)
                    .append($specialOnly).append($includeCanOder)
                    .append("�����Ʋ���д���޶�����ÿո�ָ�,����: G32 G34")
            );

        //ע��html
        var container = $("..cx_title_w:first");
        container.length ? ui.insertBefore(container) : ui.appendTo(document.body);



        //��ʾ��ѯ����
        var displayQueryTimes = function (n) {
            document.getElementById("refreshTimes").innerHTML = n;
        };
        //Trigger the button ִ�в�ѯ
        var doQuery = function () {
            displayQueryTimes(queryTimes++);
            document.getElementById(isStudentTicket ? "stu_submitQuery" : "submitQuery").click();
        };

    }
}, true);
