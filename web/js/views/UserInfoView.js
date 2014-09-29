/* -----------------------------------------------------------------------------------------------
 * User Info View
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           $, Backbone, _, log,     // External libraries
                                    // Application modules
           undefined
         ) {

  exports.UserInfoView = Backbone.View.extend({

    tagName: 'p',
    className: 'navbar-text',

    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
    },

    // TODO: eliminate global DOM query
    template: _.template($('#tpl-user-info').html()),

    render: function() {
      log.info('UserInfoView: render');
      this.$el.html(this.template(this.model.attributes));
      return this;
    },
  });

}(window, jQuery, Backbone, _, log));
