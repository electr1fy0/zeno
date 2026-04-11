(function () {
  "use strict";

  function showFlash($rootScope, message) {
    $rootScope.flashMessage = message;
    window.clearTimeout($rootScope.flashTimer);
    $rootScope.flashTimer = window.setTimeout(function () {
      $rootScope.$applyAsync(function () {
        $rootScope.flashMessage = "";
      });
    }, 3000);
  }

  function api(method, url, data) {
    return $.ajax({
      method: method,
      url: url,
      data: data ? JSON.stringify(data) : undefined,
      contentType: data ? "application/json" : undefined,
      dataType: "json",
    });
  }

  function readError(xhr, fallback) {
    return xhr && xhr.responseJSON && xhr.responseJSON.error
      ? xhr.responseJSON.error
      : fallback;
  }

  function sendToLoginIfUnauthorized(xhr, $location) {
    if (xhr && xhr.status === 401) {
      $location.path("/login");
      return true;
    }

    return false;
  }

  function setCurrentUser($rootScope, user) {
    $rootScope.currentUser = user || null;
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isStrongPassword(value) {
    return (
      value.length >= 8 &&
      /[0-9]/.test(value) &&
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /[^A-Za-z0-9]/.test(value)
    );
  }

  function readAuthForm(vm, event) {
    var form = event && event.currentTarget ? $(event.currentTarget) : null;

    return {
      email: (form ? form.find('[name="email"]').val() : vm.form.email) || "",
      password: (form ? form.find('[name="password"]').val() : vm.form.password) || "",
    };
  }

  function validateAuthForm(vm, mode, event) {
    var form = readAuthForm(vm, event);
    var email = form.email.trim().toLowerCase();
    var password = form.password;

    if (!email) {
      return { message: "Enter an email." };
    }

    if (!isEmail(email)) {
      return { message: "Enter a valid email." };
    }

    if (!password.trim()) {
      return { message: "Enter a password." };
    }

    if (mode === "register" && !isStrongPassword(password)) {
      return {
        message:
          "Password needs 8+ characters, a number, uppercase, lowercase, and a symbol.",
      };
    }

    return {
      email: email,
      password: password,
    };
  }

  function submitAuth(vm, $rootScope, $location, mode, url, event) {
    var result = validateAuthForm(vm, mode, event);

    if (result.message) {
      vm.warning = result.message;
      return;
    }

    vm.warning = "";

    vm.loading = true;

    api("POST", url, {
      email: result.email,
      password: result.password,
    })
      .done(function (response) {
        $rootScope.$applyAsync(function () {
          setCurrentUser($rootScope, response.user);
          $location.path("/chat");
        });
      })
      .fail(function (xhr) {
        $rootScope.$applyAsync(function () {
          vm.warning = readError(xhr, "Request failed.");
        });
      })
      .always(function () {
        $rootScope.$applyAsync(function () {
          vm.loading = false;
        });
      });
  }

  const app = angular.module("zenoApp", ["ngRoute"]);

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
          redirectTo: "/login",
        });

      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false,
      });
    },
  ]);

  app.run([
    "$rootScope",
    function ($rootScope) {
      $rootScope.currentUser = null;
      $rootScope.flashMessage = "";
    },
  ]);

  app.controller("AppController", [
    "$rootScope",
    "$location",
    function ($rootScope, $location) {
      var vm = this;

      vm.currentUser = null;
      vm.flashMessage = "";
      vm.showHeader = true;

      vm.logout = function () {
        api("POST", "/api/auth/logout").always(function () {
          $rootScope.$applyAsync(function () {
            setCurrentUser($rootScope, null);
            vm.currentUser = null;
            $location.path("/login");
          });
        });
      };

      vm.deleteAccount = function () {
        if (!window.confirm("Delete your account and all chats?")) {
          return;
        }

        api("DELETE", "/api/auth/account")
          .done(function () {
            $rootScope.$applyAsync(function () {
              setCurrentUser($rootScope, null);
              vm.currentUser = null;
              $location.path("/register");
            });
          })
          .fail(function (xhr) {
            $rootScope.$applyAsync(function () {
              showFlash($rootScope, readError(xhr, "Could not delete account."));
            });
          });
      };

      api("GET", "/api/auth/me")
        .done(function (response) {
          $rootScope.$applyAsync(function () {
            setCurrentUser($rootScope, response.user);
          });
        })
        .fail(function (xhr) {
          $rootScope.$applyAsync(function () {
            if ($location.path().indexOf("/chat") === 0) {
              sendToLoginIfUnauthorized(xhr, $location);
            }
          });
        });

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
    "$rootScope",
    "$location",
    function ($rootScope, $location) {
      var vm = this;

      vm.form = { email: "", password: "" };
      vm.loading = false;
      vm.warning = "";

      vm.login = function (event) {
        submitAuth(
          vm,
          $rootScope,
          $location,
          "login",
          "/api/auth/login",
          event,
        );
      };
    },
  ]);

  app.controller("RegisterController", [
    "$rootScope",
    "$location",
    function ($rootScope, $location) {
      var vm = this;

      vm.form = { email: "", password: "" };
      vm.loading = false;
      vm.warning = "";

      vm.register = function (event) {
        submitAuth(
          vm,
          $rootScope,
          $location,
          "register",
          "/api/auth/register",
          event,
        );
      };
    },
  ]);

  app.controller("ChatController", [
    "$rootScope",
    "$location",
    "$routeParams",
    "$timeout",
    "$window",
    function ($rootScope, $location, $routeParams, $timeout, $window) {
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

      vm.filteredHistory = function () {
        var query = (vm.searchQuery || "").trim().toLowerCase();

        if (!query) {
          return vm.history;
        }

        return vm.history.filter(function (chat) {
          return (chat.title || "").toLowerCase().indexOf(query) !== -1;
        });
      };

      vm.openChat = function (chatId) {
        vm.closeSidebar();
        $location.path("/chat/" + chatId);
      };

      vm.logout = function () {
        api("POST", "/api/auth/logout").always(function () {
          $rootScope.$applyAsync(function () {
            setCurrentUser($rootScope, null);
            vm.currentUser = null;
            $location.path("/login");
          });
        });
      };

      vm.deleteAccount = function () {
        if (!window.confirm("Delete your account and all chats?")) {
          return;
        }

        api("DELETE", "/api/auth/account")
          .done(function () {
            $rootScope.$applyAsync(function () {
              setCurrentUser($rootScope, null);
              vm.currentUser = null;
              vm.history = [];
              vm.messages = [];
              vm.activeChatId = "";
              vm.draft = "";
              $location.path("/register");
            });
          })
          .fail(function (xhr) {
            $rootScope.$applyAsync(function () {
              if (sendToLoginIfUnauthorized(xhr, $location)) {
                return;
              }

              showFlash($rootScope, readError(xhr, "Could not delete account."));
            });
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

      vm.loadHistory = function () {
        api("GET", "/api/chats")
          .done(function (history) {
            $rootScope.$applyAsync(function () {
              vm.history = history;
            });
          })
          .fail(function (xhr) {
            $rootScope.$applyAsync(function () {
              if (sendToLoginIfUnauthorized(xhr, $location)) {
                return;
              }

              showFlash($rootScope, "Could not load chats.");
            });
          });
      };

      vm.loadChat = function (chatId) {
        if (!chatId) {
          vm.activeChatId = "";
          vm.messages = [];
          return;
        }

        vm.loading = true;

        api("GET", "/api/chats/" + chatId)
          .done(function (chat) {
            $rootScope.$applyAsync(function () {
              vm.activeChatId = chat._id;
              vm.messages = chat.messages || [];
              vm.scrollToBottom();
            });
          })
          .fail(function (xhr) {
            $rootScope.$applyAsync(function () {
              if (sendToLoginIfUnauthorized(xhr, $location)) {
                return;
              }

              showFlash($rootScope, readError(xhr, "Could not load chat."));
              $location.path("/chat");
            });
          })
          .always(function () {
            $rootScope.$applyAsync(function () {
              vm.loading = false;
            });
          });
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

        api("DELETE", "/api/chats/" + chatId)
          .done(function () {
            $rootScope.$applyAsync(function () {
              vm.history = vm.history.filter(function (chat) {
                return chat._id !== chatId;
              });

              if (vm.activeChatId === chatId) {
                vm.activeChatId = "";
                vm.messages = [];
                vm.draft = "";
                $location.path("/chat");
              }
            });
          })
          .fail(function (xhr) {
            $rootScope.$applyAsync(function () {
              if (sendToLoginIfUnauthorized(xhr, $location)) {
                return;
              }

              showFlash($rootScope, readError(xhr, "Could not delete chat."));
            });
          })
          .always(function () {
            $rootScope.$applyAsync(function () {
              vm.loading = false;
            });
          });
      };

      vm.sendMessage = function () {
        var text = (vm.draft || "").trim();
        var url = "/api/chats";

        if (!text || vm.loading) {
          return;
        }

        vm.loading = true;
        vm.draft = "";

        if (!vm.activeChatId) {
          vm.messages = [{ role: "user", content: text }];
          vm.scrollToBottom();
        } else {
          vm.messages = vm.messages.concat([{ role: "user", content: text }]);
          vm.scrollToBottom();
          url = "/api/chats/" + vm.activeChatId + "/messages";
        }

        api("POST", url, { message: text })
          .done(function (chat) {
            $rootScope.$applyAsync(function () {
              vm.activeChatId = chat._id;
              vm.messages = chat.messages || [];
              vm.loadHistory();
              vm.scrollToBottom();

              if ($location.path() !== "/chat/" + chat._id) {
                $location.path("/chat/" + chat._id);
              }
            });
          })
          .fail(function (xhr) {
            $rootScope.$applyAsync(function () {
              if (!vm.activeChatId) {
                vm.messages = [];
              }

              if (sendToLoginIfUnauthorized(xhr, $location)) {
                return;
              }

              showFlash(
                $rootScope,
                readError(
                  xhr,
                  vm.activeChatId
                    ? "Could not send message."
                    : "Could not start chat.",
                ),
              );
            });
          })
          .always(function () {
            $rootScope.$applyAsync(function () {
              vm.loading = false;
            });
          });
      };

      vm.loadHistory();
      vm.loadChat(vm.activeChatId);
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
