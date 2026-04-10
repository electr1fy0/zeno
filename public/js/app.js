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

  function showFlash($rootScope, message) {
    $rootScope.flashMessage = message;
    window.clearTimeout($rootScope.flashTimer);
    $rootScope.flashTimer = window.setTimeout(function () {
      $rootScope.$applyAsync(function () {
        $rootScope.flashMessage = "";
      });
    }, 3000);
  }

  function readAjaxError(xhr, fallbackMessage) {
    return xhr && xhr.responseJSON && xhr.responseJSON.error
      ? xhr.responseJSON.error
      : fallbackMessage;
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

  app.run([
    "$rootScope",
    function ($rootScope) {
      $rootScope.flashMessage = "";
      $rootScope.currentUser = null;
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
        $.ajax({
          method: "POST",
          url: "/api/auth/logout",
        }).always(function () {
          $rootScope.$applyAsync(function () {
            $rootScope.currentUser = null;
            vm.currentUser = null;
            $location.path("/login");
          });
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
    function ($location, $rootScope) {
      var vm = this;
      vm.form = { username: "", password: "" };
      vm.loading = false;

      vm.login = function () {
        vm.loading = true;
        $.ajax({
          method: "POST",
          url: "/api/auth/login",
          data: JSON.stringify(vm.form),
          contentType: "application/json",
          dataType: "json",
        })
          .done(function (response) {
            $rootScope.$applyAsync(function () {
              $rootScope.currentUser = response.user;
              $location.path("/chat");
            });
          })
          .fail(function (xhr) {
            $rootScope.$applyAsync(function () {
              showFlash($rootScope, readAjaxError(xhr, "Login failed."));
            });
          })
          .always(function () {
            $rootScope.$applyAsync(function () {
              vm.loading = false;
            });
          });
      };
    },
  ]);

  app.controller("RegisterController", [
    "$location",
    "$rootScope",
    function ($location, $rootScope) {
      var vm = this;
      vm.form = { username: "", password: "" };
      vm.loading = false;

      vm.register = function () {
        vm.loading = true;
        $.ajax({
          method: "POST",
          url: "/api/auth/register",
          data: JSON.stringify(vm.form),
          contentType: "application/json",
          dataType: "json",
        })
          .done(function (response) {
            $rootScope.$applyAsync(function () {
              $rootScope.currentUser = response.user;
              $location.path("/chat");
            });
          })
          .fail(function (xhr) {
            $rootScope.$applyAsync(function () {
              showFlash($rootScope, readAjaxError(xhr, "Registration failed."));
            });
          })
          .always(function () {
            $rootScope.$applyAsync(function () {
              vm.loading = false;
            });
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

      vm.loadHistory = function () {
        return $.getJSON("/api/chats")
          .done(function (history) {
            $rootScope.$applyAsync(function () {
              vm.history = history;
            });
          })
          .fail(function (xhr) {
            $rootScope.$applyAsync(function () {
              if (xhr.status === 401) {
                $location.path("/login");
                return;
              }

              showFlash($rootScope, "Could not load chats.");
            });
          });
      };

      vm.loadChat = function (chatId) {
        if (!chatId) {
          vm.messages = [];
          vm.activeChatId = "";
          return;
        }

        vm.loading = true;
        return $.getJSON("/api/chats/" + chatId)
          .done(function (chat) {
            $rootScope.$applyAsync(function () {
              vm.activeChatId = chat._id;
              vm.messages = chat.messages || [];
              vm.scrollToBottom();
            });
          })
          .fail(function (xhr) {
            $rootScope.$applyAsync(function () {
              if (xhr.status === 401) {
                $location.path("/login");
                return;
              }

              showFlash($rootScope, readAjaxError(xhr, "Could not load chat."));
              $location.path("/chat");
            });
          })
          .always(function () {
            $rootScope.$applyAsync(function () {
              vm.loading = false;
            });
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
        $.ajax({
          method: "DELETE",
          url: "/api/chats/" + chatId,
        })
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
              if (xhr.status === 401) {
                $location.path("/login");
                return;
              }

              showFlash(
                $rootScope,
                readAjaxError(xhr, "Could not delete chat."),
              );
            });
          })
          .always(function () {
            $rootScope.$applyAsync(function () {
              vm.loading = false;
            });
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
        $.ajax({
          method: "POST",
          url: "/api/auth/logout",
        }).always(function () {
          $rootScope.$applyAsync(function () {
            $rootScope.currentUser = null;
            vm.currentUser = null;
            $location.path("/login");
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

          $.ajax({
            method: "POST",
            url: "/api/chats",
            data: JSON.stringify({ message: text }),
            contentType: "application/json",
            dataType: "json",
          })
            .done(function (chat) {
              $rootScope.$applyAsync(function () {
                vm.activeChatId = chat._id;
                vm.messages = chat.messages || [];
                vm.loadHistory();
                $location.path("/chat/" + chat._id);
                vm.scrollToBottom();
              });
            })
            .fail(function (xhr) {
              $rootScope.$applyAsync(function () {
                vm.messages = [];

                if (xhr.status === 401) {
                  $location.path("/login");
                  return;
                }

                showFlash(
                  $rootScope,
                  readAjaxError(xhr, "Could not start chat."),
                );
              });
            })
            .always(function () {
              $rootScope.$applyAsync(function () {
                vm.loading = false;
              });
            });
          return;
        }

        vm.messages = vm.messages.concat([{ role: "user", content: text }]);
        vm.scrollToBottom();

        $.ajax({
          method: "POST",
          url: "/api/chats/" + vm.activeChatId + "/messages",
          data: JSON.stringify({ message: text }),
          contentType: "application/json",
          dataType: "json",
        })
          .done(function (chat) {
            $rootScope.$applyAsync(function () {
              vm.messages = chat.messages || [];
              vm.loadHistory();
              vm.scrollToBottom();
            });
          })
          .fail(function (xhr) {
            $rootScope.$applyAsync(function () {
              if (xhr.status === 401) {
                $location.path("/login");
                return;
              }

              showFlash(
                $rootScope,
                readAjaxError(xhr, "Could not send message."),
              );
            });
          })
          .always(function () {
            $rootScope.$applyAsync(function () {
              vm.loading = false;
            });
          });
      };

      $.getJSON("/api/auth/me")
        .done(function (response) {
          $rootScope.$applyAsync(function () {
            $rootScope.currentUser = response.user;
            vm.currentUser = response.user;
          });
        })
        .fail(function (xhr) {
          $rootScope.$applyAsync(function () {
            if (xhr.status === 401) {
              $location.path("/login");
            }
          });
        });

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
