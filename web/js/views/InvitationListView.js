/* -----------------------------------------------------------------------------------------------
 * Invitation List View
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           $, Backbone, _, log,     // External libraries
                                    // Application modules
           undefined
         ) {

  exports.InvitationListView = Backbone.View.extend({

    className: 'invitation-list',

    events: {
      'click .invite-accept': 'inviteAccept',
      'click .invite-decline': 'inviteDecline',
      'click .invite-cancel': 'inviteCancel'
    },

    initialize: function(options) {
      this.listenTo(this.collection, 'add remove', this.render);
    },

    // TODO: eliminate global DOM query
    incomingTemplate: _.template($('#tpl-incoming-invite').html()),
    outgoingTemplate: _.template($('#tpl-outgoing-invite').html()),

    render: function() {
      var self = this;

      // TODO: could be optimized by constructing a new detached DOM element and swapping it in once
      // at the end
      this.$el.empty();
      this.collection.each(function(invitation) {
        var template = invitation.get('incoming') ? self.incomingTemplate : self.outgoingTemplate;
        var invitationData = JSON.parse(JSON.stringify(invitation));
        self.$el.append(template(invitationData));
      });

      return this;
    },

    inviteAccept: function(event) {
      log.info('InvitationListView: inviteAccept');
      var index = this.$('.invitation').index($(event.currentTarget).parents('.invitation'));
      this.collection.acceptInvitation(index);
    },
    inviteDecline: function(event) {
      log.info('InvitationListView: inviteDecline');
      var index = this.$('.invitation').index($(event.currentTarget).parents('.invitation'));
      this.collection.declineInvitation(index);
    },
    inviteCancel: function(event) {
      log.info('InvitationListView: inviteCancel');
      var index = this.$('.invitation').index($(event.currentTarget).parents('.invitation'));
      this.collection.cancelInvitation(index);
    },

  });

}(window, jQuery, Backbone, _, log));
