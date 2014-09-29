/* -----------------------------------------------------------------------------------------------
 * Buddy List Collection
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           Backbone, _, log,        // External libraries
           RemoteUser,              // Application modules
           undefined
         ) {

  exports.BuddyList = Backbone.Collection.extend({

    model: RemoteUser,

    initialize: function(models, options) {
      if (!options.dispatcher) {
        log.error('BuddyList: initialize() cannot be called without a dispatcher');
        return;
      }
      this.dispatcher = options.dispatcher;
      this.dispatcher.once('presenceSessionReady', this.presenceSessionReady, this);
      this.dispatcher.on('getRemoteUser', this.getRemoteUser, this);
    },

    addRemoteUser: function(connection) {
      var newUser = new RemoteUser({},{
        presenceSession: this.presenceSession,
        connection: connection
      });

      log.info('BuddyList: addRemoteUser', newUser);
      this.push(newUser);
    },

    removeRemoteUser: function(connection) {
      var removingUser = this.find(function(remoteUser) {
        return remoteUser.connection === connection;
      });
      if (!removingUser) {
        log.warn('BuddyList: removeRemoteUser could not find remote user based on connection');
        return;
      }
      log.info('BuddyList: removeRemoteUser', removingUser);
      this.remove(removingUser);
    },

    getRemoteUser: function(connection) {
      var self = this;
      log.info('BuddyList: getRemoteUser');
      var remoteUser = this.find(function(user) {
        return user.connection === connection;
      });
      var triggerRemoteUser = function() {
        self.dispatcher.trigger('remoteUser~' + connection.connectionId, remoteUser);
      };
      if (remoteUser) {
        setTimeout(triggerRemoteUser, 0);
      } else {
        // OPENTOK-17314 workaround for getRemoteUser
        this.on('add', function searchAddedUsers(addedUser) {
          if (addedUser.connection === connection) {
            remoteUser = addedUser;
            triggerRemoteUser();
            self.off('add', searchAddedUsers);
          }
        }, this);
      }
    },

    // OPENTOK-17314 workaround for status updates
    signalReceived: function(event) {
      var self = this;
      var separatedType = event.type.split('~');
      if (separatedType.length === 2 && separatedType[1] === 'status') {
        // This is a status update signal
        var remoteUser = this.find(function(r) { return r.connection === event.from; });
        if (!remoteUser) {
          // We don't yet have a RemoteUser instance for this user, so we should queue a function
          // that does the status update
          var queuedStatusUpdate = function queuedStatusUpdate(addedUser) {
            if (addedUser.connection === event.from) {
              addedUser.set('status', event.data);
              self.off('add', queuedStatusUpdate);
            }
          };
          this.on('add', queuedStatusUpdate);
        }
      }
    },

    presenceConnectionCreated: function(event) {
      if (event.connection.connectionId !== this.presenceSession.connection.connectionId) {
        this.addRemoteUser(event.connection);
      }
    },

    presenceConnectionDestroyed: function(event) {
      if (event.connection.connectionId !== this.presenceSession.connection.connectionId) {
        this.removeRemoteUser(event.connection);
      }
    },

    presenceSessionReady: function(presenceSession) {
      this.presenceSession = presenceSession;

      this.presenceSession.on('connectionCreated', this.presenceConnectionCreated, this);
      this.presenceSession.on('connectionDestroyed', this.presenceConnectionDestroyed, this);
      this.presenceSession.on('signal', this.signalReceived, this);
    }

  });

}(window, Backbone, _, log, RemoteUser));
