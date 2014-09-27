/* -----------------------------------------------------------------------------------------------
 * Local User Model
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           Backbone, _, log,        // External libraries
                                    // Application modules
           undefined
         ) {

  exports.LocalUser = Backbone.Model.extend({

    defaults: {
      name : null,
      status: 'offline',
      // NOTE: this is a derived property but it makes templating easier
      connected: false,
      // NOTE: 'token' set by server after 'sync'
      token: null
    },

    allStatuses: ['online', 'offline', 'outgoingInvitePending', 'chatting'],
    // Statuses where the Remote User representation of this user will appear invitable
    availableStatuses: ['online'],

    NAME_MAX_LENGTH: 100,

    urlRoot: '/users',

    initialize: function(attrs, options) {
      if (!options.dispatcher) {
        log.error('ConnectModalView: initialize() cannot be called without a dispatcher');
        return;
      }
      options.dispatcher.once('presenceSessionReady', this.presenceSessionReady, this);

      this.on('change:status', this.statusChanged, this);
      this.on('change:status', this.sendRemoteStatus, this);
      this.once('sync', this.connect, this);
    },

    validate: function(attrs, options) {
      log.info('LocalUser: validate');
      if (!attrs.name || attrs.name.length === 0) {
        return [{
          attribute: 'name',
          reason: 'User must have a name property'
        }];
      }

      if (attrs.name.length > this.NAME_MAX_LENGTH) {
        return [{
          attribute: 'name',
          reason: 'User name must be shorter than ' + constConfig.NAME_MAX_LENGTH +
                  ' characters'
        }];
      }
    },

    presenceSessionReady: function(presenceSession) {
      this.presenceSession = presenceSession;
      this.presenceSession.on('sessionConnected', this.connected, this);
      this.presenceSession.on('sessionDisconnected', this.disconnected, this);
    },

    connect: function() {
      log.info('LocalUser: connect');
      if (!this.presenceSession) {
        log.error('LocalUser: connect() cannot be invoked when there is no presenceSession set');
        return;
      }
      // TODO: connection error handling
      this.presenceSession.connect(this.get('token'));
    },

    disconnect: function() {
      log.info('LocalUser: disconnect');
      if (!this.presenceSession) {
        log.error('LocalUser: disconnect() cannot be invoked when there is no presenceSession set');
        return;
      }
      this.presenceSession.disconnect();
    },

    connected: function(event) {
      this.set('status', 'online');
    },

    disconnected: function(event) {
      this.set('status', 'offline');
    },

    statusChanged: function(self, status) {
      log.info('LocalUser: statusChanged', status);
      // compute derived properties that are based on status
      this.set('connected', _.include(this.connectedStatuses, status));

      // TODO: let the dispatcher know whether user is available or not
      // buddy list will need to know so that its ui can be disabled or not
    },

    // TODO: send new connections my own status
    sendRemoteStatus: function(self, status) {
      log.info('LocalUser: sendRemoteStatus');
      // an 'offline' status update is sent to remote users as a connectionDestroyed
      if (status === 'offline') {
        return;
      }
      var signal = {
        type: this.presenceSession.connection.connectionId + '~status'
      };
      if (_.include(this.availableStatuses, status)) {
        signal.data = 'online';
      } else {
        signal.data = 'unavailable';
      }
      // TODO: handle errors via completion
      this.presenceSession.signal(signal);
    }
  });

  // NOTE: Because of how Backbone creates prototypes, there is no way to refer to the allStatuses
  // property inside the call to extend(). The prototype only exists after that call completes.
  exports.LocalUser.prototype.connectedStatuses = _.without(LocalUser.prototype.allStatuses, 'offline');

}(window, Backbone, _, log));