(function () {
  "use strict";

  function validateAuthForm($form) {
    var $username = $form.find('input[type="text"]');
    var $password = $form.find('input[type="password"]');
    var $error = $form.find(".auth-form-error");
    var username = ($username.val() || "").trim();
    var password = ($password.val() || "").trim();
    var isValid = true;

    $error.addClass("d-none").text("");

    if (username.length < 3) {
      $username.addClass("is-invalid");
      isValid = false;
    } else {
      $username.removeClass("is-invalid");
    }

    if (password.length < 4) {
      $password.addClass("is-invalid");
      isValid = false;
    } else {
      $password.removeClass("is-invalid");
    }

    if (!isValid) {
      $error
        .removeClass("d-none")
        .text("Please fix the highlighted fields before continuing.");
    }

    return isValid;
  }

  $(document).on("submit", ".auth-form", function (event) {
    if (!validateAuthForm($(this))) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  $(document).on("input", ".auth-form input", function () {
    var $input = $(this);
    var $form = $input.closest(".auth-form");
    $input.removeClass("is-invalid");

    if ($form.find(".is-invalid").length === 0) {
      $form.find(".auth-form-error").addClass("d-none").text("");
    }
  });

  var app = angular.module("zenoApp", ["ngRoute"]);

  app.config([
    "$routeProvider",
    "$locationProvider",
    function ($routeProvider, $locationProvider) {
      $routeProvider
        .when("/login", {
          templateUrl: "/templates/login.html",
          controller: "LoginController",
          controllerAs: "vm",
        })
        .when("/register", {
          templateUrl: "/templates/register.html",
          controller: "RegisterController",
          controllerAs: "vm",
        })
        .when("/chat", {
          templateUrl: "/templates/chat.html",
          controller: "ChatController",
          controllerAs: "vm",
        })
        .when("/chat/:id", {
          templateUrl: "/templates/chat.html",
          controller: "ChatController",
          controllerAs: "vm",
        })
        .otherwise({
          redirectTo: "/chat",
        });

      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false,
      });
    },
  ]);

  app.factory("FlashService", [
    "$rootScope",
    function ($rootScope) {
      return {
        show: function (message) {
          $rootScope.flashMessage = message;
          window.clearTimeout($rootScope.flashTimer);
          $rootScope.flashTimer = window.setTimeout(function () {
            $rootScope.$applyAsync(function () {
              $rootScope.flashMessage = "";
            });
          }, 3000);
        },
      };
    },
  ]);

  app.factory("ApiService", [
    "$rootScope",
    function ($rootScope) {
      function applyAsync(callback) {
        $rootScope.$applyAsync(callback);
      }

      function normalizeSuccess(data, xhr) {
        return {
          data: data,
          status: xhr && typeof xhr.status === "number" ? xhr.status : 200,
        };
      }

      function normalizeError(xhr) {
        return {
          data: xhr && xhr.responseJSON ? xhr.responseJSON : null,
          status: xhr && typeof xhr.status === "number" ? xhr.status : 0,
        };
      }

      function getJson(url) {
        return new Promise(function (resolve, reject) {
          $.getJSON(url)
            .done(function (data, _textStatus, xhr) {
              applyAsync(function () {
                resolve(normalizeSuccess(data, xhr));
              });
            })
            .fail(function (xhr) {
              applyAsync(function () {
                reject(normalizeError(xhr));
              });
            });
        });
      }

      function postJson(url, payload, options) {
        var settings = options || {};

        return new Promise(function (resolve, reject) {
          $.ajax({
            method: "POST",
            url: url,
            data: payload ? JSON.stringify(payload) : null,
            contentType: "application/json",
            dataType: settings.expectJson === false ? undefined : "json",
          })
            .done(function (data, _textStatus, xhr) {
              applyAsync(function () {
                resolve(normalizeSuccess(data, xhr));
              });
            })
            .fail(function (xhr) {
              applyAsync(function () {
                reject(normalizeError(xhr));
              });
            });
        });
      }

      function deleteRequest(url) {
        return new Promise(function (resolve, reject) {
          $.ajax({
            method: "DELETE",
            url: url,
          })
            .done(function (data, _textStatus, xhr) {
              applyAsync(function () {
                resolve(normalizeSuccess(data, xhr));
              });
            })
            .fail(function (xhr) {
              applyAsync(function () {
                reject(normalizeError(xhr));
              });
            });
        });
      }

      return {
        register: function (payload) {
          return postJson("/api/auth/register", payload);
        },
        login: function (payload) {
          return postJson("/api/auth/login", payload);
        },
        logout: function () {
          return postJson("/api/auth/logout", null, { expectJson: false });
        },
        getCurrentUser: function () {
          return getJson("/api/auth/me");
        },
        getChats: function () {
          return getJson("/api/chats");
        },
        getChat: function (id) {
          return getJson("/api/chats/" + id);
        },
        createChat: function (payload) {
          return postJson("/api/chats", payload);
        },
        sendMessage: function (id, payload) {
          return postJson("/api/chats/" + id + "/messages", payload);
        },
        deleteChat: function (id) {
          return deleteRequest("/api/chats/" + id);
        },
      };
    },
  ]);

  app.factory("AuthService", [
    "ApiService",
    "$location",
    function (ApiService, $location) {
      var currentUser = null;

      return {
        refreshUser: function () {
          return ApiService.getCurrentUser()
            .then(function (response) {
              currentUser = response.data.user;
              return currentUser;
            })
            .catch(function () {
              currentUser = null;
              return null;
            });
        },
        setUser: function (user) {
          currentUser = user;
        },
        redirectIfNeeded: function (path) {
          var publicPaths = ["/login", "/register"];
          return this.refreshUser().then(function (user) {
            if (!user && publicPaths.indexOf(path) === -1) {
              $location.path("/login");
              return null;
            }

            if (user && publicPaths.indexOf(path) !== -1) {
              $location.path("/chat");
            }

            return user;
          });
        },
      };
    },
  ]);

  app.run([
    "$rootScope",
    "$location",
    "AuthService",
    function ($rootScope, $location, AuthService) {
      $rootScope.flashMessage = "";

      $rootScope.$on("$routeChangeStart", function (_event, next) {
        var path = next && next.$$route ? next.$$route.originalPath : $location.path();
        AuthService.redirectIfNeeded(path).then(function (user) {
          $rootScope.currentUser = user;
        });
      });
    },
  ]);

  app.directive("zenoAutosize", [
    function () {
      return {
        restrict: "A",
        link: function (_scope, element) {
          function resize() {
            element[0].style.height = "auto";
            element[0].style.height = Math.min(element[0].scrollHeight, 240) + "px";
          }

          element.on("input", resize);
          setTimeout(resize, 0);
        },
      };
    },
  ]);

  app.controller("AppController", [
    "$rootScope",
    "$location",
    "ApiService",
    "AuthService",
    "FlashService",
    function ($rootScope, $location, ApiService, AuthService, FlashService) {
      var vm = this;
      vm.currentUser = null;
      vm.flashMessage = "";
      vm.showHeader = true;

      vm.logout = function () {
        ApiService.logout().finally(function () {
          AuthService.setUser(null);
          $rootScope.currentUser = null;
          vm.currentUser = null;
          $location.path("/login");
        });
      };

      $rootScope.$watch("currentUser", function (user) {
        vm.currentUser = user;
      });

      $rootScope.$watch("flashMessage", function (message) {
        vm.flashMessage = message;
      });

      $rootScope.$watch(
        function () {
          return $location.path();
        },
        function (path) {
          vm.showHeader = path === "/login" || path === "/register";
        },
      );
    },
  ]);

  app.controller("LoginController", [
    "$location",
    "$rootScope",
    "ApiService",
    "AuthService",
    "FlashService",
    function ($location, $rootScope, ApiService, AuthService, FlashService) {
      var vm = this;
      vm.form = { username: "", password: "" };
      vm.loading = false;

      vm.login = function () {
        vm.loading = true;
        ApiService.login(vm.form)
          .then(function (response) {
            AuthService.setUser(response.data.user);
            $rootScope.currentUser = response.data.user;
            $location.path("/chat");
          })
          .catch(function (error) {
            FlashService.show(error.data && error.data.error ? error.data.error : "Login failed.");
          })
          .finally(function () {
            vm.loading = false;
          });
      };
    },
  ]);

  app.controller("RegisterController", [
    "$location",
    "$rootScope",
    "ApiService",
    "AuthService",
    "FlashService",
    function ($location, $rootScope, ApiService, AuthService, FlashService) {
      var vm = this;
      vm.form = { username: "", password: "" };
      vm.loading = false;

      vm.register = function () {
        vm.loading = true;
        ApiService.register(vm.form)
          .then(function (response) {
            AuthService.setUser(response.data.user);
            $rootScope.currentUser = response.data.user;
            $location.path("/chat");
          })
          .catch(function (error) {
            FlashService.show(error.data && error.data.error ? error.data.error : "Registration failed.");
          })
          .finally(function () {
            vm.loading = false;
          });
      };
    },
  ]);

  app.controller("ChatController", [
    "$rootScope",
    "$location",
    "$routeParams",
    "$timeout",
    "$window",
    "ApiService",
    "AuthService",
    "FlashService",
    function ($rootScope, $location, $routeParams, $timeout, $window, ApiService, AuthService, FlashService) {
      var vm = this;
      vm.history = [];
      vm.messages = [];
      vm.activeChatId = $routeParams.id || "";
      vm.draft = "";
      vm.searchQuery = "";
      vm.loading = false;
      vm.currentUser = $rootScope.currentUser || null;
      vm.sidebarOpen = false;

      vm.isMobileSidebar = function () {
        return $window.innerWidth <= 960;
      };

      vm.syncSidebarState = function () {
        if (vm.isMobileSidebar()) {
          vm.sidebarOpen = false;
        }
      };

      vm.toggleSidebar = function () {
        if (vm.isMobileSidebar()) {
          vm.sidebarOpen = !vm.sidebarOpen;
        }
      };

      vm.closeSidebar = function () {
        if (vm.isMobileSidebar()) {
          vm.sidebarOpen = false;
        }
      };

      vm.scrollToBottom = function () {
        $timeout(function () {
          var scroller = document.getElementById("chat-scroll");
          if (scroller) {
            scroller.scrollTop = scroller.scrollHeight;
          }
        }, 0);
      };

      vm.loadHistory = function () {
        return ApiService.getChats()
          .then(function (response) {
            vm.history = response.data;
          })
          .catch(function (error) {
            if (error.status === 401) {
              $location.path("/login");
              return;
            }

            FlashService.show("Could not load chats.");
          });
      };

      vm.loadChat = function (chatId) {
        if (!chatId) {
          vm.messages = [];
          vm.activeChatId = "";
          return;
        }

        vm.loading = true;
        return ApiService.getChat(chatId)
          .then(function (response) {
            vm.activeChatId = response.data._id;
            vm.messages = response.data.messages || [];
            vm.scrollToBottom();
          })
          .catch(function (error) {
            if (error.status === 401) {
              $location.path("/login");
              return;
            }

            FlashService.show(error.data && error.data.error ? error.data.error : "Could not load chat.");
            $location.path("/chat");
          })
          .finally(function () {
            vm.loading = false;
          });
      };

      vm.openChat = function (chatId) {
        vm.closeSidebar();
        $location.path("/chat/" + chatId);
      };

      vm.deleteChat = function (chatId, event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }

        if (!chatId || vm.loading) {
          return;
        }

        vm.loading = true;
        ApiService.deleteChat(chatId)
          .then(function () {
            vm.history = vm.history.filter(function (chat) {
              return chat._id !== chatId;
            });

            if (vm.activeChatId === chatId) {
              vm.activeChatId = "";
              vm.messages = [];
              vm.draft = "";
              $location.path("/chat");
            }
          })
          .catch(function (error) {
            if (error.status === 401) {
              $location.path("/login");
              return;
            }

            FlashService.show(error.data && error.data.error ? error.data.error : "Could not delete chat.");
          })
          .finally(function () {
            vm.loading = false;
          });
      };

      vm.filteredHistory = function () {
        var query = (vm.searchQuery || "").trim().toLowerCase();
        if (!query) {
          return vm.history;
        }

        return vm.history.filter(function (chat) {
          return (chat.title || "New chat").toLowerCase().indexOf(query) !== -1;
        });
      };

      vm.logout = function () {
        ApiService.logout().finally(function () {
          AuthService.setUser(null);
          $rootScope.currentUser = null;
          vm.currentUser = null;
          $location.path("/login");
        });
      };

      vm.startNewChat = function () {
        vm.activeChatId = "";
        vm.messages = [];
        vm.draft = "";
        vm.closeSidebar();
        $location.path("/chat");
      };

      vm.handleComposerKeydown = function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          vm.sendMessage();
        }
      };

      vm.sendMessage = function () {
        var text = (vm.draft || "").trim();
        if (!text || vm.loading) {
          return;
        }

        vm.loading = true;
        vm.draft = "";

        if (!vm.activeChatId) {
          vm.messages = [{ role: "user", content: text }];
          vm.scrollToBottom();
          ApiService.createChat({ message: text })
            .then(function (response) {
              vm.activeChatId = response.data._id;
              vm.messages = response.data.messages || [];
              vm.loadHistory();
              $location.path("/chat/" + response.data._id);
              vm.scrollToBottom();
            })
            .catch(function (error) {
              vm.messages = [];
              FlashService.show(error.data && error.data.error ? error.data.error : "Could not start chat.");
            })
            .finally(function () {
              vm.loading = false;
            });
          return;
        }

        vm.messages = vm.messages.concat([{ role: "user", content: text }]);
        vm.scrollToBottom();

        ApiService.sendMessage(vm.activeChatId, { message: text })
          .then(function (response) {
            vm.messages = response.data.messages || [];
            vm.loadHistory();
            vm.scrollToBottom();
          })
          .catch(function (error) {
            if (error.status === 401) {
              $location.path("/login");
              return;
            }

            FlashService.show(error.data && error.data.error ? error.data.error : "Could not send message.");
          })
          .finally(function () {
            vm.loading = false;
          });
      };

      vm.loadHistory();
      vm.loadChat($routeParams.id || "");
      vm.syncSidebarState();

      angular.element($window).on("resize", function () {
        $rootScope.$applyAsync(function () {
          vm.syncSidebarState();
        });
      });

      $rootScope.$watch("currentUser", function (user) {
        vm.currentUser = user;
      });

      $rootScope.$on("$destroy", function () {
        angular.element($window).off("resize");
      });
    },
  ]);
})();
