'use strict';

chrome.browserAction.setBadgeText({ text: '0' });

function jInvoker() {
  if ($.signalR) {
    loadHub();
  } else {
    setTimeout(jInvoker, 50);
  }
}

jInvoker();

function loadHub() {
  var signalR = $.signalR;

  function makeProxyCallback(hub, callback) {
    return function() {
      // Call the client hub method
      callback.apply(hub, $.makeArray(arguments));
    };
  }

  function registerHubProxies(instance, shouldSubscribe) {
    var key, hub, memberKey, memberValue, subscriptionMethod;

    for (key in instance) {
      if (instance.hasOwnProperty(key)) {
        hub = instance[key];

        if (!(hub.hubName)) {
          // Not a client hub
          continue;
        }

        if (shouldSubscribe) {
          // We want to subscribe to the hub events
          subscriptionMethod = hub.on;
        } else {
          // We want to unsubscribe from the hub events
          subscriptionMethod = hub.off;
        }

        // Loop through all members on the hub and find client hub functions to subscribe/unsubscribe
        for (memberKey in hub.client) {
          if (hub.client.hasOwnProperty(memberKey)) {
            memberValue = hub.client[memberKey];

            if (!$.isFunction(memberValue)) {
              // Not a client hub function
              continue;
            }

            subscriptionMethod.call(hub, memberKey, makeProxyCallback(hub, memberValue));
          }
        }
      }
    }
  }

  $.hubConnection.prototype.createHubProxies = function() {
    var proxies = {};
    this.starting(function() {
      // Register the hub proxies as subscribed
      // (instance, shouldSubscribe)
      registerHubProxies(proxies, true);

      this._registerSubscribedHubs();
    }).disconnected(function() {
      // Unsubscribe all hub proxies when we "disconnect".  This is to ensure that we do not re-add functional call backs.
      // (instance, shouldSubscribe)
      registerHubProxies(proxies, false);
    });

    proxies['messageHub'] = this.createHubProxy('messageHub');
    proxies['messageHub'].client = {};
    proxies['messageHub'].server = {
      isSentMessage: function() {
        return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["isSentMessage"], $.makeArray(arguments)));
      },

      registerNotifications: function() {
        return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["RegisterNotifications"], $.makeArray(arguments)));
      },

      sendNotifiacation: function(request) {
        return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["SendNotifiacation"], $.makeArray(arguments)));
      }
    };

    proxies['notificationHub'] = this.createHubProxy('notificationHub');
    proxies['notificationHub'].client = {};
    proxies['notificationHub'].server = {
      isSentNotification: function() {
        return proxies['notificationHub'].invoke.apply(proxies['notificationHub'], $.merge(["isSentNotification"], $.makeArray(arguments)));
      },

      registerNotifications: function() {
        return proxies['notificationHub'].invoke.apply(proxies['notificationHub'], $.merge(["RegisterNotifications"], $.makeArray(arguments)));
      }
    };

    return proxies;
  };

  signalR.hub = $.hubConnection("http://www.puiv.com/signalr", { useDefaultPath: false });
  $.extend(signalR, signalR.hub.createHubProxies());

  var message = $.connection.messageHub;

  message.client.refreshMessage = function(data) {
  	notificationManager(data, 'msg');
  }

  var notifications = $.connection.notificationHub;

  notifications.client.refreshNotification = function(data) {
  	notificationManager(data, 'not');
  }

  $.connection.hub.start().done(function() {
  	message.server.registerNotifications();
    notifications.server.registerNotifications();
  }).fail(function(e) {
    console.log(e);
  });
}

var messages = [];
var notifications = [];
var shownIds = [];

var notificationManager = function(arr, type){
	if(type === 'msg'){
		messages = arr.filter(function(i){
			return !i.IsRead;
		});
	}else if(type === 'not'){
		notifications = arr.Notifications.filter(function(i){
			return !i.IsRead;
		});
	}
	createBadge();
}

var createBadge = function(){
	chrome.browserAction.setBadgeText({ text: (notifications.length + messages.length).toString() });
	createNotifications();
}

var createNotifications = function(){
	for(var x = 0 ; x < notifications.length; x++){
    if(!shownIds.find(function(i){
      return i.id == notifications[x].Id.toString()
    })){
  		chrome.notifications.create(notifications[x].Id.toString(),
  			{   
  		    type: 'basic', 
  		    iconUrl: 'images/logo_red.png', 
  		    title: "Yeni Bildirim", 
  		    message: notifications[x].Message,
  		    buttons: [{
          	title: "Göster"
     			}]
  	    }
      );
      var priv = notifications[x].AffectedSlug;
      shownIds.push({
        id: notifications[x].Id.toString(),
        onclick: function(priv){
          var newURL = "http://www.puiv.com" + priv;
          chrome.tabs.create({ url: newURL });
        },
        url:priv
      });
  	}
  }

  for(var x = 0 ; x < messages.length; x++){
    if(!shownIds.find(function(i){
      return i.id == messages[x].Id.toString()
    })){
      chrome.notifications.create(messages[x].Id.toString(),
        {   
          type: 'basic', 
          iconUrl: "http://www.puiv.com" + messages[x].SenderAvatar, 
          title: messages[x].SenderUserName, 
          message: messages[x].Body,
          buttons: [{
            title: "Göster"
          }]
        }
      );
      shownIds.push({
        id: messages[x].Id.toString(),
        onclick: function(priv){
          var newURL = priv;
          chrome.tabs.create({ url: newURL });
        },
        url:'"http://www.puiv.com/k/mesajlar/gelen-kutusu"'
      });
    }
  }
}

chrome.notifications.onButtonClicked.addListener(function(notifId) {
  if (notifId) {
    var notification = shownIds.find(function(i){
      return i.id === notifId;
    });
    if(notification){
      notification.onclick(notification.url);
      chrome.notifications.clear(notification.id);
    }
  }
});
