'use strict';

chrome.browserAction.setBadgeText({ text: '0' });

var messages = [];
var notifications = [];
var shownIds = [];

var checkNewNotifications = function() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "https://www.puiv.com/k/popupbildirimler", false);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      if (IsJsonString(xhr.responseText)) {
        notificationManager(JSON.parse(xhr.responseText), 'not');
      }
    }
  }
  xhr.send();
}

var checkNewMessages = function() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "https://www.puiv.com/k/popupmessages", false);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      if (IsJsonString(xhr.responseText)) {
        notificationManager(JSON.parse(xhr.responseText), 'msg');
      }
    }
  }
  xhr.send();
}

var notificationManager = function(arr, type) {
  if (type === 'msg') {
    messages = arr.filter(function(i) {
      return !i.IsRead;
    });
  } else if (type === 'not') {
    notifications = arr.filter(function(i) {
      return !i.IsRead;
    });
  }
  createBadge();
}

var createBadge = function() {
  chrome.browserAction.setBadgeText({ text: (notifications.length + messages.length).toString() });
  createNotifications();
}

var createNotifications = function() {
  for (var x = 0; x < notifications.length; x++) {
    if (!shownIds.find(function(i) {
        return i.id == notifications[x].Id.toString()
      })) {
      chrome.notifications.create(notifications[x].Id.toString(), {
        type: 'basic',
        iconUrl: 'images/logo_red.png',
        title: "Yeni Bildirim",
        message: notifications[x].Message,
        buttons: [{
          title: "Göster"
        }]
      });
      var priv = notifications[x].AffectedSlug;
      shownIds.push({
        id: notifications[x].Id.toString(),
        onclick: function(priv) {
          var newURL = "https://www.puiv.com" + priv;
          chrome.tabs.create({ url: newURL });
        },
        url: priv
      });
    }
  }

  for (var x = 0; x < messages.length; x++) {
    if (!shownIds.find(function(i) {
        return i.id == messages[x].Id.toString()
      })) {
      chrome.notifications.create(messages[x].Id.toString(), {
        type: 'basic',
        iconUrl: "https://www.puiv.com" + messages[x].SenderAvatar,
        title: messages[x].SenderUserName,
        message: messages[x].Body,
        buttons: [{
          title: "Göster"
        }]
      });
      shownIds.push({
        id: messages[x].Id.toString(),
        onclick: function(priv) {
          var newURL = priv;
          chrome.tabs.create({ url: newURL });
        },
        url: '"https://www.puiv.com/k/mesajlar/gelen-kutusu"'
      });
    }
  }
}

chrome.notifications.onButtonClicked.addListener(function(notifId) {
  if (notifId) {
    var notification = shownIds.find(function(i) {
      return i.id === notifId;
    });
    if (notification) {
      notification.onclick(notification.url);
      chrome.notifications.clear(notification.id);
    }
  }
});

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({ url: "https://www.puiv.com/" });
});

function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

setInterval(function() {
  checkNewNotifications();
  checkNewMessages();
}, 3000);