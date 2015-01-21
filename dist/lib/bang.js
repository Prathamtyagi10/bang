(function() {
  var BangJsonPath, BangJsonPathFragment, BangJsonView, bang, bangJsonView, bangUri, didReset, didRunQuery, getPathFragmentForKey, load, originBody, prettyPrint, queryResult, render, renderHeader, renderQuery, renderQueryForm, renderResponse, replacer, runQuery, stringifyPadingSize,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  bang = null;

  bangUri = null;

  queryResult = null;

  bangJsonView = null;

  originBody = null;

  BangJsonPathFragment = (function(_super) {
    __extends(BangJsonPathFragment, _super);

    function BangJsonPathFragment() {
      return BangJsonPathFragment.__super__.constructor.apply(this, arguments);
    }

    BangJsonPathFragment.prototype.getQueryFragment = function() {
      var arrayName, arrayRx, fullExpression, keyName, keyRx, type, _ref, _ref1;
      arrayRx = /^(.+)\[]$/;
      keyRx = /^:(.+)$/;
      type = this.getFragmentType();
      switch (type) {
        case "ArrayRoot":
          _ref = this.get("fragment").match(arrayRx), fullExpression = _ref[0], arrayName = _ref[1];
          return arrayName;
        case "ArrayKey":
          _ref1 = this.get("fragment").match(keyRx), fullExpression = _ref1[0], keyName = _ref1[1];
          return "map(function(row){return row." + keyName + ";})";
        default:
          return this.get("fragment");
      }
    };

    BangJsonPathFragment.prototype.getFragmentType = function() {
      var arrayElementRx, arrayRx, keyRx;
      arrayRx = /^(.+)\[]$/;
      arrayElementRx = /^(.+)\[(\d+)]$/;
      keyRx = /^:(.+)$/;
      if (arrayRx.test(this.get("fragment"))) {
        return "ArrayRoot";
      } else if (arrayElementRx.test(this.get("fragment"))) {
        return "ArrayElement";
      } else if (keyRx.test(this.get("fragment"))) {
        return "ArrayKey";
      } else {
        return "Value";
      }
    };

    BangJsonPathFragment.prototype.getArrayKeyName = function() {
      var fullExpression, keyName, keyRx, _ref;
      keyRx = /^:(.+)$/;
      if (keyRx.test(this.get("fragment"))) {
        _ref = this.get("fragment").match(keyRx), fullExpression = _ref[0], keyName = _ref[1];
        return keyName;
      }
    };

    BangJsonPathFragment.prototype.getArrayIndex = function() {
      var arrayElementRx, arrayIndex, fullExpression, keyName, _ref;
      arrayElementRx = /^(.+)\[(\d+)]$/;
      if (arrayElementRx.test(this.get("fragment"))) {
        _ref = this.get("fragment").match(arrayElementRx), fullExpression = _ref[0], keyName = _ref[1], arrayIndex = _ref[2];
        return [keyName, parseInt(arrayIndex)];
      }
    };

    BangJsonPathFragment.prototype.getDisplayName = function() {
      return this.get("fragment");
    };

    BangJsonPathFragment.prototype.getBaseFragment = function() {
      var arrayName, arrayRx, fullName, _ref;
      arrayRx = /^(.+)\[(\d+)]$/;
      if (arrayRx.test(this.get("fragment"))) {
        _ref = this.get("fragment").match(arrayRx), fullName = _ref[0], arrayName = _ref[1];
        return arrayName + "[]";
      }
    };

    BangJsonPathFragment.prototype.getArrayFragment = function(index) {
      var arrayName, arrayRx, fullName, _ref;
      arrayRx = /^(.+)\[\d*]$/;
      if (arrayRx.test(this.get("fragment"))) {
        _ref = this.get("fragment").match(arrayRx), fullName = _ref[0], arrayName = _ref[1];
        return arrayName + ("[" + index + "]");
      }
    };

    return BangJsonPathFragment;

  })(Backbone.Model);

  BangJsonPath = (function(_super) {
    __extends(BangJsonPath, _super);

    function BangJsonPath() {
      return BangJsonPath.__super__.constructor.apply(this, arguments);
    }

    BangJsonPath.prototype.model = BangJsonPathFragment;

    BangJsonPath.prototype.initialize = function(models, option) {
      if (option && option.baseExpression) {
        return this.baseExpression = option.baseExpression;
      } else {
        return this.baseExpression = models[0].get("fragment");
      }
    };

    BangJsonPath.prototype.getQuery = function(path) {
      var reducer;
      reducer = (function(pv, cv, index, array) {
        if (index === 0) {
          return cv.getQueryFragment();
        }
        if (cv.getFragmentType() === "Value") {
          return pv + ("['" + (cv.getQueryFragment()) + "']");
        } else {
          return pv + "." + cv.getQueryFragment();
        }
      });
      if (path) {
        return path.reduce(reducer, "");
      } else {
        return this.reduce(reducer, "");
      }
    };

    BangJsonPath.prototype.getDisplayedQuery = function() {
      var reducer;
      reducer = (function(pv, cv, index, array) {
        if (index === 0) {
          return pv;
        }
        if (cv.getFragmentType() === "Value") {
          return pv + ("['" + (cv.getQueryFragment()) + "']");
        } else {
          return pv + "." + cv.getQueryFragment();
        }
      });
      return this.reduce(reducer, this.baseExpression);
    };

    BangJsonPath.prototype.navigateTo = function(index) {
      while (this.models.length > Math.max(index + 1, 0)) {
        this.pop();
      }
      return this.trigger("path:update");
    };

    BangJsonPath.prototype.navigateToArrayElement = function(index) {
      var arrayFragment;
      if (arrayFragment = this.last().getArrayFragment(index)) {
        this.last().set("fragment", arrayFragment);
        return this.trigger("path:update");
      }
    };

    return BangJsonPath;

  })(Backbone.Collection);

  BangJsonView = (function(_super) {
    __extends(BangJsonView, _super);

    function BangJsonView() {
      return BangJsonView.__super__.constructor.apply(this, arguments);
    }

    BangJsonView.prototype.model = BangJsonPath;

    BangJsonView.prototype.render = function() {
      var header, panelBody, root;
      root = d3.select(this.el);
      header = root.append("div").attr("class", "panel-heading");
      header.append("span").attr("class", "panel-title").text("JSON Navigator");
      panelBody = root.append("div").attr("class", "panel-body");
      this.breadcrumbUl = panelBody.append("ul").attr("class", "breadcrumb");
      this.codeBlockPre = panelBody.append("pre");
      $(this.codeBlockPre.node()).hide();
      this.arrayContentTable = root.append("table").attr("class", "table");
      this.indexSelectorDiv = root.append("div").attr("class", "panel-footer").append("div").attr("class", "form-inline");
      return this.listenTo(this.model, "path:update", this.updateNavigator);
    };

    BangJsonView.prototype.updateNavigator = function(option) {
      var error, path, query, result, type, _ref;
      this.clear();
      path = this.model;
      query = path.getQuery();
      _ref = runQuery(query), error = _ref.error, result = _ref.result;
      if (!(option && option.silent)) {
        $("#query").val(path.getDisplayedQuery());
      }
      if (error) {
        return this.breadcrumbUl.text(JSON.stringify(error, null, 4));
      }
      this.breadcrumbUl.selectAll("li").data(this.model.models).enter().append("li").each(function(pathFragment, i) {
        if (i === 0 && pathFragment.getDisplayName() === "bang") {
          return d3.select(this).append("strong").text(pathFragment.getDisplayName());
        }
        if (i === path.length - 1) {
          if (pathFragment.getBaseFragment()) {
            return d3.select(this).append("a").attr("href", "#").text(pathFragment.getDisplayName()).on("click", function() {
              d3.event.preventDefault();
              path.last().set("fragment", pathFragment.getBaseFragment());
              return path.trigger("path:update");
            });
          } else {
            return d3.select(this).append("span").text(pathFragment.getDisplayName());
          }
        } else {
          return d3.select(this).append("a").attr("href", "#").text(pathFragment.getDisplayName()).on("click", function() {
            d3.event.preventDefault();
            return path.navigateTo(i);
          });
        }
      });
      type = path.last().getFragmentType();
      if (result instanceof Array) {
        if (type === "ArrayRoot") {
          this.updateArrayContent(result);
        } else if (type === "ArrayKey") {
          this.updateArrayPluckView(result, path.last().getArrayKeyName());
        }
      } else if (result instanceof Object) {
        this.updateKeyValuePair(result);
      } else {
        this.codeBlockPre.html(prettyPrint(result));
        $(this.codeBlockPre.node()).show();
      }
      if (type === "ArrayElement") {
        return this.updateArrayNavigator(path.last().getArrayIndex());
      }
    };

    BangJsonView.prototype.updateArrayNavigator = function(_arg) {
      var arrayIndex, arrayName, maxLength, pager, query;
      arrayName = _arg[0], arrayIndex = _arg[1];
      pager = this.indexSelectorDiv.append("nav").append("ul").attr("class", "pager");
      query = bangJsonView.model.getQuery(bangJsonView.model.slice(0, bangJsonView.model.length - 1).concat(new BangJsonPathFragment({
        fragment: arrayName + "[]"
      })));
      maxLength = eval(query).length;
      if (arrayIndex > 0) {
        pager.append("li").attr("class", "previous").append("a").attr("href", "#").html("&larr;Previous").on("click", function() {
          d3.event.preventDefault();
          return bangJsonView.model.navigateToArrayElement(arrayIndex - 1);
        });
      } else {
        pager.append("li").attr("class", "previous disabled").append("a").attr("href", "#").html("&larr;Previous");
      }
      pager.append("li").html("" + (arrayIndex + 1) + " / " + maxLength);
      if (arrayIndex < maxLength - 1) {
        return pager.append("li").attr("class", "next").append("a").attr("href", "#").html("Next&rarr;").on("click", function() {
          d3.event.preventDefault();
          return bangJsonView.model.navigateToArrayElement(arrayIndex + 1);
        });
      } else {
        return pager.append("li").attr("class", "next disabled").append("a").attr("href", "#").html("Next&rarr;");
      }
    };

    BangJsonView.prototype.updateKeyValuePair = function(result) {
      this.arrayContentTable.append("thead").html("<thead><tr>\n  <th>Key</th><th>Value</th>\n</tr></thead>");
      return this.arrayContentTable.append("tfoot").selectAll("tr").data(Object.keys(result)).enter().append("tr").each(function(key) {
        var pathFragment;
        if (!(result[key] instanceof Array || result[key] instanceof Object)) {
          d3.select(this).append("th").text(key);
          return d3.select(this).append("td").text(result[key] || "(empty)");
        } else {
          pathFragment = getPathFragmentForKey(result, key);
          d3.select(this).append("th").append("a").attr("href", "#").text(pathFragment.get("fragment")).on("click", function() {
            d3.event.preventDefault();
            bangJsonView.model.add(pathFragment);
            return bangJsonView.model.trigger("path:update");
          });
          if (result[key] instanceof Array) {
            return d3.select(this).append("td").text("Array with " + result[key].length + " elements");
          } else {
            return d3.select(this).append("td").text("Object with " + (_.size(result[key])) + " key value pairs");
          }
        }
      });
    };

    BangJsonView.prototype.updateArrayContent = function(result) {
      var keyStats;
      if (result.length === 0) {
        return this.indexSelectorDiv.html("<span>Empty array</span>");
      } else {
        this.indexSelectorDiv.append("div").attr("class", "input-group").html("<span class=\"input-group-addon\">Element No.</span>\n<input type='number' class='form-control' id='arrayIndex' value='0' min='0' max='" + (result.length - 1) + "'>\n<span class=\"input-group-addon\">/ " + result.length + "</span>");
        this.indexSelectorDiv.append("button").attr("type", "submit").attr("class", "btn btn-default").text("Go").on("click", function() {
          var index;
          d3.event.preventDefault();
          index = $("#arrayIndex").val();
          return bangJsonView.model.navigateToArrayElement(index);
        });
        keyStats = {};
        result.forEach(function(row) {
          return _.keys(row).forEach(function(key) {
            return keyStats[key] = (keyStats[key] || 0) + 1;
          });
        });
        if (_.size(keyStats) > 0) {
          return this.updateArraySchemaTable(_.pairs(keyStats), result);
        } else {
          this.codeBlockPre.html(prettyPrint(result));
          return $(this.codeBlockPre.node()).show();
        }
      }
    };

    BangJsonView.prototype.updateArrayPluckView = function(result, key) {
      this.arrayContentTable.append("thead").html("<thead><tr>\n  <th>Index</th><th>Value</th>\n</tr></thead>");
      return this.arrayContentTable.append("tfoot").selectAll("tr").data(result).enter().append("tr").each(function(value, i) {
        d3.select(this).append("th").append("a").attr("href", "#").text("Element " + i).on("click", function() {
          d3.event.preventDefault();
          bangJsonView.model.pop();
          bangJsonView.model.navigateToArrayElement(i);
          if (value instanceof Object) {
            bangJsonView.model.push({
              fragment: key
            });
          }
          return bangJsonView.model.trigger("path:update");
        });
        if (value instanceof Object) {
          return d3.select(this).append("td").append("pre").html(prettyPrint(value) || "(empty)");
        } else {
          return d3.select(this).append("td").text(value || "(empty)");
        }
      });
    };

    BangJsonView.prototype.updateArraySchemaTable = function(keyStats, array) {
      var rows;
      this.arrayContentTable.append("thead").html("<thead><tr>\n  <th>Key</th><th>Times occurred in elements</th>\n</tr></thead>");
      rows = this.arrayContentTable.append("tfoot").selectAll("tr").data(keyStats).enter().append("tr");
      rows.append("th").append("a").attr("href", "#").text(function(_arg) {
        var key;
        key = _arg[0];
        return key;
      }).on("click", function(_arg) {
        var key;
        key = _arg[0];
        d3.event.preventDefault();
        bangJsonView.model.push(new BangJsonPathFragment({
          fragment: ":" + key
        }));
        return bangJsonView.model.trigger("path:update");
      });
      return rows.append("td").text(function(_arg) {
        var key, times;
        key = _arg[0], times = _arg[1];
        return "" + times + " (" + ((100 * times / array.length).toFixed(0)) + "%)";
      });
    };

    BangJsonView.prototype.clear = function() {
      this.breadcrumbUl.text("");
      this.indexSelectorDiv.text("");
      this.codeBlockPre.text("");
      $(this.codeBlockPre.node()).hide();
      return this.arrayContentTable.text("");
    };

    return BangJsonView;

  })(Backbone.View);

  render = function() {
    var queryRow, responseRow, root;
    console.log("Bang will make your life with JSON easier!");
    root = d3.select("body").text("").append("div").attr("class", "container");
    renderHeader(root.append("div").attr("class", "navbar navbar-default"));
    queryRow = root.append("div").attr("class", "row");
    responseRow = root.append("div").attr("class", "row");
    bangJsonView = new BangJsonView({
      model: new BangJsonPath([
        new BangJsonPathFragment({
          fragment: "bang"
        })
      ]),
      el: queryRow.append("div").attr("class", "col-lg-6 col-md-6 col-sm-12 col-xs-12").append("div").attr("class", "panel panel-default").attr("id", "navigatorPanel").node()
    });
    bangJsonView.render();
    renderQuery(queryRow.append("div").attr("class", "col-lg-6 col-md-6 col-sm-12 col-xs-12").append("div").attr("class", "panel panel-default").attr("id", "queryPanel"));
    renderResponse(responseRow.append("div").attr("class", "col-lg-12 col-md-12 col-sm-12 col-xs-12").append("div").attr("class", "panel panel-success"));
    $(".panel-heading");
    $(".panel-toggle").click(function(ev) {
      ev.preventDefault();
      return $(ev.currentTarget).parent().siblings(".panel-body").toggle();
    });
    root.append("link").attr({
      rel: "stylesheet",
      href: chrome.extension.getURL('lib/bootstrap/bootstrap.css'),
      type: "text/css"
    });
    root.append("link").attr({
      rel: "stylesheet",
      href: chrome.extension.getURL('lib/bang.css'),
      type: "text/css"
    });
    return bangJsonView.model.trigger("path:update");
  };

  renderHeader = function(root) {
    root.html("<div class=\"navbar-header\">\n  <a class=\"navbar-brand\" href=\"http://github.com/roboxue/bang\">Bang\n    <ruby>\n     棒 <rt> Bàng</rt>\n    </ruby>\n    <small>(Awesome)</small>\n  </a>\n</div>\n<div class=\"collapse navbar-collapse\">\n  <p class=\"navbar-text\">Lightweight awesome <code>JSON</code> workspace - the raw response is in variable <code class=\"bang\">bang</code></p>\n  <p class=\"navbar-text navbar-right\"><a href=\"#\" class=\"navbar-link\" id=\"dismiss\">Dismiss Workspace</a></p>\n</div>");
    return $("#dismiss").click(function(ev) {
      ev.preventDefault();
      return d3.select("body").text("").append("pre").html(JSON.stringify(JSON.parse(originBody), null, stringifyPadingSize));
    });
  };

  renderResponse = function(root) {
    var header;
    header = root.append("div").attr("class", "panel-heading");
    header.append("span").attr("class", "panel-title").html("Response from <code>" + bangUri + "</code> stored into <code class='bang'>bang</code>");
    header.append("div").attr("class", "panel-toggle pull-right").text("toggle");
    root.append("div").attr("class", "panel-body").append("div").attr("id", "rawResponse").html(prettyPrint(bang));
    $("#rawResponse [data-index][data-folded]").each(function() {
      var childSiblings, currentIndex, node;
      node = $(this);
      currentIndex = parseInt(node.data("index"));
      childSiblings = node.nextUntil("[data-index=" + currentIndex + "]").filter(function() {
        return $(this).data("index") > currentIndex;
      });
      if (childSiblings.length) {
        node.find(".glyphicon").addClass("glyphicon-minus");
        return node.css("cursor", "pointer");
      }
    });
    return $("#rawResponse [data-index][data-folded]").click(function(ev) {
      var childSiblings, currentIndex, node;
      node = $(ev.currentTarget);
      currentIndex = parseInt(node.data("index"));
      childSiblings = node.nextUntil("[data-index=" + currentIndex + "]").filter(function() {
        return $(this).data("index") > currentIndex;
      });
      if (childSiblings) {
        if (node.data("folded") === false) {
          node.data("folded", true);
          node.find(".glyphicon").removeClass("glyphicon-minus").addClass("glyphicon-plus").text("");
          childSiblings.hide();
          return childSiblings.each(function() {
            var foldedTimes;
            foldedTimes = $(this).data("folds") ? parseInt($(this).data("folds")) + 1 : 1;
            return $(this).data("folds", foldedTimes);
          });
        } else {
          node.data("folded", false);
          node.find(".glyphicon").removeClass("glyphicon-plus").addClass("glyphicon-minus").text("");
          return childSiblings.each(function() {
            var foldedTimes;
            foldedTimes = $(this).data("folds") ? parseInt($(this).data("folds")) - 1 : 0;
            $(this).data("folds", foldedTimes);
            if (foldedTimes === 0) {
              return $(this).show();
            }
          });
        }
      }
    });
  };

  renderQuery = function(root) {
    var header;
    header = root.append("div").attr("class", "panel-heading");
    header.append("span").attr("class", "panel-title").html("Custom JavaScript Query");
    return renderQueryForm(root.append("div").attr("class", "panel-body"));
  };

  didRunQuery = function() {
    var error, query, result, _ref;
    query = $("#query").val();
    bangJsonView.clear();
    _ref = runQuery(query), error = _ref.error, result = _ref.result;
    if (error) {
      bangJsonView.codeBlockPre.text(error);
      bangJsonView.codeBlockPre.text(error);
      return $(bangJsonView.codeBlockPre.node()).show();
    } else {
      queryResult = result;
      bangJsonView.model.baseExpression = query;
      if (queryResult instanceof Array) {
        bangJsonView.model.set({
          fragment: "queryResult[]"
        });
      } else {
        bangJsonView.model.set({
          fragment: "queryResult"
        });
      }
      return bangJsonView.model.trigger("path:update");
    }
  };

  didReset = function() {
    $("#query").val("bang");
    bangJsonView.model.baseExpression = "bang";
    bangJsonView.model.set({
      fragment: "bang"
    });
    return bangJsonView.model.trigger("path:update");
  };

  runQuery = function(query) {
    var ex, result;
    try {
      result = eval(query);
      if (result === void 0) {
        return {
          error: "(undefined)"
        };
      } else {
        return {
          result: result
        };
      }
    } catch (_error) {
      ex = _error;
      return {
        error: ex
      };
    }
  };

  getPathFragmentForKey = function(data, key) {
    if (data[key] instanceof Array) {
      if (data[key].length === 1) {
        return new BangJsonPathFragment({
          fragment: key + "[0]"
        });
      } else {
        return new BangJsonPathFragment({
          fragment: key + "[]"
        });
      }
    } else {
      return new BangJsonPathFragment({
        fragment: key
      });
    }
  };

  renderQueryForm = function(root) {
    root.html("<div class=\"form-horizontal\">\n  <div class=\"form-group\">\n    <label for=\"query\" class=\"col-sm-2 control-label\">Query</label>\n    <div class=\"col-sm-10\">\n      <textarea class=\"form-control\" id=\"query\" placeholder=\"Any Javascript Expression!\"></textarea>\n    </div>\n  </div>\n  <div class=\"form-group\">\n    <div class=\"col-sm-offset-2 col-sm-10\">\n      <button type=\"submit\" class=\"btn btn-default\" id=\"runQuery\">Run it!</button>\n      <button type=\"reset\" class=\"btn btn-default\" id=\"reset\">Reset</button>\n    </div>\n  </div>\n</div>");
    $("#runQuery").click(didRunQuery);
    return $("#reset, .bang").click(didReset);
  };

  stringifyPadingSize = 4;

  replacer = function(match, pIndent, pKey, pVal, pEnd) {
    var index, key, r, str, val;
    key = '<span class=json-key>';
    val = '<span class=json-value>';
    str = '<span class=json-string>';
    r = pIndent || '';
    index = r.length / stringifyPadingSize;
    r = r.replace(/\s/g, '&nbsp;');
    if (pKey) {
      r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
    }
    if (pVal) {
      r = r + (pVal[0] === '"' ? str : val) + pVal + '</span>';
    }
    return "<p data-folded='false' data-index='" + index + "' class='json-row'><span class='glyphicon col-sm-1'></span><span class='col-sm-11 json-content'>" + (r + (pEnd || '')) + "</span></p>";
  };

  prettyPrint = function(obj) {
    var jsonLine;
    jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,\[\{}\]]*)?$/mg;
    return JSON.stringify(obj, null, stringifyPadingSize).replace(/&/g, '&amp;').replace(/\\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(jsonLine, replacer);
  };

  load = function() {
    var ex;
    try {
      if (!(document.body && (document.body.childNodes[0] && document.body.childNodes[0].tagName === "PRE" || document.body.children.length === 0))) {
        return;
      }
      originBody = document.body.children.length ? $("pre").text() : document.body;
      if (!originBody) {
        return;
      }
      bang = JSON.parse(originBody);
      bangUri = document.location.href;
    } catch (_error) {
      ex = _error;
      console.log("Document not valid json, bang will not work: " + ex);
      console.log("Bang can't work on HTML and XML pages");
    }
    return render();
  };

  load();

}).call(this);