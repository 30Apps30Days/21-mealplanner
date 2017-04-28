'use strict';

function noop() {}

function bindEvents(thisArg, events) {
   Object.keys(events).forEach(function (selector) {
        Object.keys(events[selector]).forEach(function (event) {
            var handler = events[selector][event].bind(thisArg);
            if('document' === selector) {
                document.addEventListener(event, handler, false);
            } else if ('window' === selector) {
                window.addEventListener(event, handler, false);
            } else {
                document.querySelectorAll(selector).forEach(function (dom) {
                    dom.addEventListener(event, handler, false);
                });
            }
        });
    }); // all events bound
}

function f(name, params) {
  params = Array.prototype.slice.call(arguments, 1, arguments.length);
  return name + '(' + params.join(', ') + ')';
}

var IS_CORDOVA = !!window.cordova;

var BreakfastList = duil.List({
  $dom: $('[data-meal="breakfast"]'),
  update: function (data, index, $item) {
    $item.find('span').text(data);
    return this;
  }
});

var LunchList = duil.List({
  $dom: $('[data-meal="lunch"]'),
  update: function (data, index, $item) {
    $item.find('span').text(data);
    return this;
  }
});

var DinnerList = duil.List({
  $dom: $('[data-meal="dinner"]'),
  update: function (data, index, $item) {
    $item.find('span').text(data);
    return this;
  }
});

var app = {
  // options
  DATA_KEY: 'com.metaist.mealplanner.data',
  store: null,
  options: {
    debug: true,
    last: moment().format('YYYY-MM-DD'),
    meals: {}
  },

  // internal
  dtdialog: null,
  now: null,

  lists: {
    breakfast: BreakfastList,
    lunch: LunchList,
    dinner: DinnerList
  },

  init: function () {
    bindEvents(this, {
      'document': {'deviceready': this.ready},
      '.btn-date': {
        'click': this.toggle_date,
        'onOk': this.set_date
      }
    });

    if(!IS_CORDOVA) {
      this.options.debug && console.log('NOT cordova');
      bindEvents(this, {'window': {'load': this.ready}});
    }

    $('#app')
      .on('click', '.btn-add', this.click_add.bind(this))
      .on('click', '.btn-remove', this.click_remove.bind(this));
    return this;
  },

  ready: function () {
    this.now = moment();

    // Grab preferences
    if(IS_CORDOVA) {
      this.store = plugins.appPreferences;
      this.store.fetch(this.DATA_KEY).then(function (data) {
        Object.assign(this.options, data || {});

        this.dtdialog = new mdDateTimePicker.default({
          type: 'date',
          trigger: $('.btn-date')[0],
          init: moment(this.options.last),
          future: moment().add(2, 'years')
        });

        this.set_date().render();
      }.bind(this));
    }

    return this;
  },

  toggle_date: function () {
    this.dtdialog.toggle();
    return this;
  },

  set_date: function () {
    this.now = this.dtdialog.time;
    this.options.last = this.now.format('YYYY-MM-DD');
    return this.render();
  },

  add_dish: function (dt, meal, dish) {
    var dishes = _.get(this.options.meals, [dt, meal], []);
    dishes.push(dish);
    _.set(this.options.meals, [dt, meal], dishes);
    this.lists[meal].set({data: dishes}, true);
    return this.save().render();
  },

  click_add: function (e) {
    var $dom = $(e.target).parents('.mdl-list__item')
                          .find('.mdl-textfield__input');
    var meal = $dom.attr('id').replace('add-', '');
    var dish = $dom.val().trim();

    if (dish) {
      this.add_dish(this.options.last, meal, dish);
      $dom.val('').focus();
    }
    return this;
  },

  remove_dish: function (dt, meal, idx) {
    var dishes = _.get(this.options.meals, [dt, meal]);
    if (!dishes) { return this; }

    dishes.splice(idx, 1); // remove the dish
    this.lists[meal].set({data: dishes}, true);
    return this.save().render();
  },

  click_remove: function (e) {
    var $dom = $(e.target);
    var idx = $dom.parents('.mdl-list__item').index();
    var meal = $dom.parents('.mdl-list').data('meal');
    return this.remove_dish(this.options.last, meal, idx);
  },

  save: function () {
    if (IS_CORDOVA) {
      this.store.store(noop, noop, this.DATA_KEY, this.options);
    }//end if: options stored
    return this;
  },

  render: function () {
    $('.txt-date').text(this.now.format('ddd, MMM DD'));

    _.each(this.lists, function (list, meal) {
      var dishes = _.get(this.options.meals, [this.options.last, meal], []);
      list.set({data: dishes});
    }.bind(this));
    return this;
  }
};

app.init();
