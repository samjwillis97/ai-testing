(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [118],
  {
    8234: function (t, e, r) {
      'use strict';
      r.d(e, {
        Z: function () {
          return U;
        },
      });
      var i = (function () {
          function t(t) {
            var e = this;
            (this._insertTag = function (t) {
              var r;
              (r =
                0 === e.tags.length
                  ? e.insertionPoint
                    ? e.insertionPoint.nextSibling
                    : e.prepend
                      ? e.container.firstChild
                      : e.before
                  : e.tags[e.tags.length - 1].nextSibling),
                e.container.insertBefore(t, r),
                e.tags.push(t);
            }),
              (this.isSpeedy = void 0 === t.speedy || t.speedy),
              (this.tags = []),
              (this.ctr = 0),
              (this.nonce = t.nonce),
              (this.key = t.key),
              (this.container = t.container),
              (this.prepend = t.prepend),
              (this.insertionPoint = t.insertionPoint),
              (this.before = null);
          }
          var e = t.prototype;
          return (
            (e.hydrate = function (t) {
              t.forEach(this._insertTag);
            }),
            (e.insert = function (t) {
              if (this.ctr % (this.isSpeedy ? 65e3 : 1) == 0) {
                var e;
                this._insertTag(
                  ((e = document.createElement('style')).setAttribute('data-emotion', this.key),
                  void 0 !== this.nonce && e.setAttribute('nonce', this.nonce),
                  e.appendChild(document.createTextNode('')),
                  e.setAttribute('data-s', ''),
                  e)
                );
              }
              var r = this.tags[this.tags.length - 1];
              if (this.isSpeedy) {
                var i = (function (t) {
                  if (t.sheet) return t.sheet;
                  for (var e = 0; e < document.styleSheets.length; e++)
                    if (document.styleSheets[e].ownerNode === t) return document.styleSheets[e];
                })(r);
                try {
                  i.insertRule(t, i.cssRules.length);
                } catch (t) {}
              } else r.appendChild(document.createTextNode(t));
              this.ctr++;
            }),
            (e.flush = function () {
              this.tags.forEach(function (t) {
                var e;
                return null == (e = t.parentNode) ? void 0 : e.removeChild(t);
              }),
                (this.tags = []),
                (this.ctr = 0);
            }),
            t
          );
        })(),
        n = Math.abs,
        o = String.fromCharCode,
        a = Object.assign;
      function s(t, e, r) {
        return t.replace(e, r);
      }
      function l(t, e) {
        return t.indexOf(e);
      }
      function u(t, e) {
        return 0 | t.charCodeAt(e);
      }
      function c(t, e, r) {
        return t.slice(e, r);
      }
      function d(t) {
        return t.length;
      }
      function h(t, e) {
        return e.push(t), t;
      }
      var p = 1,
        f = 1,
        m = 0,
        g = 0,
        v = 0,
        y = '';
      function b(t, e, r, i, n, o, a) {
        return {
          value: t,
          root: e,
          parent: r,
          type: i,
          props: n,
          children: o,
          line: p,
          column: f,
          length: a,
          return: '',
        };
      }
      function x(t, e) {
        return a(b('', null, null, '', null, null, 0), t, { length: -t.length }, e);
      }
      function S() {
        return (v = g < m ? u(y, g++) : 0), f++, 10 === v && ((f = 1), p++), v;
      }
      function k() {
        return u(y, g);
      }
      function w(t) {
        switch (t) {
          case 0:
          case 9:
          case 10:
          case 13:
          case 32:
            return 5;
          case 33:
          case 43:
          case 44:
          case 47:
          case 62:
          case 64:
          case 126:
          case 59:
          case 123:
          case 125:
            return 4;
          case 58:
            return 3;
          case 34:
          case 39:
          case 40:
          case 91:
            return 2;
          case 41:
          case 93:
            return 1;
        }
        return 0;
      }
      function T(t) {
        return (p = f = 1), (m = d((y = t))), (g = 0), [];
      }
      function P(t) {
        var e, r;
        return ((e = g - 1),
        (r = (function t(e) {
          for (; S(); )
            switch (v) {
              case e:
                return g;
              case 34:
              case 39:
                34 !== e && 39 !== e && t(v);
                break;
              case 40:
                41 === e && t(e);
                break;
              case 92:
                S();
            }
          return g;
        })(91 === t ? t + 2 : 40 === t ? t + 1 : t)),
        c(y, e, r)).trim();
      }
      var A = '-ms-',
        C = '-moz-',
        E = '-webkit-',
        R = 'comm',
        j = 'rule',
        _ = 'decl',
        M = '@keyframes';
      function B(t, e) {
        for (var r = '', i = t.length, n = 0; n < i; n++) r += e(t[n], n, t, e) || '';
        return r;
      }
      function D(t, e, r, i) {
        switch (t.type) {
          case '@layer':
            if (t.children.length) break;
          case '@import':
          case _:
            return (t.return = t.return || t.value);
          case R:
            return '';
          case M:
            return (t.return = t.value + '{' + B(t.children, i) + '}');
          case j:
            t.value = t.props.join(',');
        }
        return d((r = B(t.children, i))) ? (t.return = t.value + '{' + r + '}') : '';
      }
      function L(t, e, r, i, o, a, l, u, d, h, p) {
        for (var f = o - 1, m = 0 === o ? a : [''], g = m.length, v = 0, y = 0, x = 0; v < i; ++v)
          for (var S = 0, k = c(t, f + 1, (f = n((y = l[v])))), w = t; S < g; ++S)
            (w = (y > 0 ? m[S] + ' ' + k : s(k, /&\f/g, m[S])).trim()) && (d[x++] = w);
        return b(t, e, r, 0 === o ? j : u, d, h, p);
      }
      function O(t, e, r, i) {
        return b(t, e, r, _, c(t, 0, i), c(t, i + 1, -1), i);
      }
      var V = function (t, e, r) {
          for (var i = 0, n = 0; (i = n), (n = k()), 38 === i && 12 === n && (e[r] = 1), !w(n); )
            S();
          return c(y, t, g);
        },
        I = function (t, e) {
          var r = -1,
            i = 44;
          do
            switch (w(i)) {
              case 0:
                38 === i && 12 === k() && (e[r] = 1), (t[r] += V(g - 1, e, r));
                break;
              case 2:
                t[r] += P(i);
                break;
              case 4:
                if (44 === i) {
                  (t[++r] = 58 === k() ? '&\f' : ''), (e[r] = t[r].length);
                  break;
                }
              default:
                t[r] += o(i);
            }
          while ((i = S()));
          return t;
        },
        $ = function (t, e) {
          var r;
          return (r = I(T(t), e)), (y = ''), r;
        },
        F = new WeakMap(),
        z = function (t) {
          if ('rule' === t.type && t.parent && !(t.length < 1)) {
            for (
              var e = t.value, r = t.parent, i = t.column === r.column && t.line === r.line;
              'rule' !== r.type;

            )
              if (!(r = r.parent)) return;
            if ((1 !== t.props.length || 58 === e.charCodeAt(0) || F.get(r)) && !i) {
              F.set(t, !0);
              for (var n = [], o = $(e, n), a = r.props, s = 0, l = 0; s < o.length; s++)
                for (var u = 0; u < a.length; u++, l++)
                  t.props[l] = n[s] ? o[s].replace(/&\f/g, a[u]) : a[u] + ' ' + o[s];
            }
          }
        },
        W = function (t) {
          if ('decl' === t.type) {
            var e = t.value;
            108 === e.charCodeAt(0) && 98 === e.charCodeAt(2) && ((t.return = ''), (t.value = ''));
          }
        },
        N = [
          function (t, e, r, i) {
            if (t.length > -1 && !t.return)
              switch (t.type) {
                case _:
                  t.return = (function t(e, r) {
                    switch (
                      45 ^ u(e, 0)
                        ? (((((((r << 2) ^ u(e, 0)) << 2) ^ u(e, 1)) << 2) ^ u(e, 2)) << 2) ^
                          u(e, 3)
                        : 0
                    ) {
                      case 5103:
                        return E + 'print-' + e + e;
                      case 5737:
                      case 4201:
                      case 3177:
                      case 3433:
                      case 1641:
                      case 4457:
                      case 2921:
                      case 5572:
                      case 6356:
                      case 5844:
                      case 3191:
                      case 6645:
                      case 3005:
                      case 6391:
                      case 5879:
                      case 5623:
                      case 6135:
                      case 4599:
                      case 4855:
                      case 4215:
                      case 6389:
                      case 5109:
                      case 5365:
                      case 5621:
                      case 3829:
                        return E + e + e;
                      case 5349:
                      case 4246:
                      case 4810:
                      case 6968:
                      case 2756:
                        return E + e + C + e + A + e + e;
                      case 6828:
                      case 4268:
                        return E + e + A + e + e;
                      case 6165:
                        return E + e + A + 'flex-' + e + e;
                      case 5187:
                        return E + e + s(e, /(\w+).+(:[^]+)/, E + 'box-$1$2' + A + 'flex-$1$2') + e;
                      case 5443:
                        return E + e + A + 'flex-item-' + s(e, /flex-|-self/, '') + e;
                      case 4675:
                        return (
                          E + e + A + 'flex-line-pack' + s(e, /align-content|flex-|-self/, '') + e
                        );
                      case 5548:
                        return E + e + A + s(e, 'shrink', 'negative') + e;
                      case 5292:
                        return E + e + A + s(e, 'basis', 'preferred-size') + e;
                      case 6060:
                        return (
                          E + 'box-' + s(e, '-grow', '') + E + e + A + s(e, 'grow', 'positive') + e
                        );
                      case 4554:
                        return E + s(e, /([^-])(transform)/g, '$1' + E + '$2') + e;
                      case 6187:
                        return (
                          s(s(s(e, /(zoom-|grab)/, E + '$1'), /(image-set)/, E + '$1'), e, '') + e
                        );
                      case 5495:
                      case 3959:
                        return s(e, /(image-set\([^]*)/, E + '$1$`$1');
                      case 4968:
                        return (
                          s(
                            s(e, /(.+:)(flex-)?(.*)/, E + 'box-pack:$3' + A + 'flex-pack:$3'),
                            /s.+-b[^;]+/,
                            'justify'
                          ) +
                          E +
                          e +
                          e
                        );
                      case 4095:
                      case 3583:
                      case 4068:
                      case 2532:
                        return s(e, /(.+)-inline(.+)/, E + '$1$2') + e;
                      case 8116:
                      case 7059:
                      case 5753:
                      case 5535:
                      case 5445:
                      case 5701:
                      case 4933:
                      case 4677:
                      case 5533:
                      case 5789:
                      case 5021:
                      case 4765:
                        if (d(e) - 1 - r > 6)
                          switch (u(e, r + 1)) {
                            case 109:
                              if (45 !== u(e, r + 4)) break;
                            case 102:
                              return (
                                s(
                                  e,
                                  /(.+:)(.+)-([^]+)/,
                                  '$1' + E + '$2-$3$1' + C + (108 == u(e, r + 3) ? '$3' : '$2-$3')
                                ) + e
                              );
                            case 115:
                              return ~l(e, 'stretch')
                                ? t(s(e, 'stretch', 'fill-available'), r) + e
                                : e;
                          }
                        break;
                      case 4949:
                        if (115 !== u(e, r + 1)) break;
                      case 6444:
                        switch (u(e, d(e) - 3 - (~l(e, '!important') && 10))) {
                          case 107:
                            return s(e, ':', ':' + E) + e;
                          case 101:
                            return (
                              s(
                                e,
                                /(.+:)([^;!]+)(;|!.+)?/,
                                '$1' +
                                  E +
                                  (45 === u(e, 14) ? 'inline-' : '') +
                                  'box$3$1' +
                                  E +
                                  '$2$3$1' +
                                  A +
                                  '$2box$3'
                              ) + e
                            );
                        }
                        break;
                      case 5936:
                        switch (u(e, r + 11)) {
                          case 114:
                            return E + e + A + s(e, /[svh]\w+-[tblr]{2}/, 'tb') + e;
                          case 108:
                            return E + e + A + s(e, /[svh]\w+-[tblr]{2}/, 'tb-rl') + e;
                          case 45:
                            return E + e + A + s(e, /[svh]\w+-[tblr]{2}/, 'lr') + e;
                        }
                        return E + e + A + e + e;
                    }
                    return e;
                  })(t.value, t.length);
                  break;
                case M:
                  return B([x(t, { value: s(t.value, '@', '@' + E) })], i);
                case j:
                  if (t.length) {
                    var n, o;
                    return (
                      (n = t.props),
                      (o = function (e) {
                        var r;
                        switch (((r = e), (r = /(::plac\w+|:read-\w+)/.exec(r)) ? r[0] : r)) {
                          case ':read-only':
                          case ':read-write':
                            return B([x(t, { props: [s(e, /:(read-\w+)/, ':' + C + '$1')] })], i);
                          case '::placeholder':
                            return B(
                              [
                                x(t, { props: [s(e, /:(plac\w+)/, ':' + E + 'input-$1')] }),
                                x(t, { props: [s(e, /:(plac\w+)/, ':' + C + '$1')] }),
                                x(t, { props: [s(e, /:(plac\w+)/, A + 'input-$1')] }),
                              ],
                              i
                            );
                        }
                        return '';
                      }),
                      n.map(o).join('')
                    );
                  }
              }
          },
        ],
        U = function (t) {
          var e,
            r,
            n,
            a,
            m,
            x,
            A = t.key;
          if ('css' === A) {
            var C = document.querySelectorAll('style[data-emotion]:not([data-s])');
            Array.prototype.forEach.call(C, function (t) {
              -1 !== t.getAttribute('data-emotion').indexOf(' ') &&
                (document.head.appendChild(t), t.setAttribute('data-s', ''));
            });
          }
          var E = t.stylisPlugins || N,
            j = {},
            _ = [];
          (a = t.container || document.head),
            Array.prototype.forEach.call(
              document.querySelectorAll('style[data-emotion^="' + A + ' "]'),
              function (t) {
                for (var e = t.getAttribute('data-emotion').split(' '), r = 1; r < e.length; r++)
                  j[e[r]] = !0;
                _.push(t);
              }
            );
          var M =
              ((r = (e = [z, W].concat(E, [
                D,
                ((n = function (t) {
                  x.insert(t);
                }),
                function (t) {
                  !t.root && (t = t.return) && n(t);
                }),
              ])).length),
              function (t, i, n, o) {
                for (var a = '', s = 0; s < r; s++) a += e[s](t, i, n, o) || '';
                return a;
              }),
            V = function (t) {
              var e, r;
              return B(
                ((r = (function t(e, r, i, n, a, m, x, T, A) {
                  for (
                    var C,
                      E = 0,
                      j = 0,
                      _ = x,
                      M = 0,
                      B = 0,
                      D = 0,
                      V = 1,
                      I = 1,
                      $ = 1,
                      F = 0,
                      z = '',
                      W = a,
                      N = m,
                      U = n,
                      H = z;
                    I;

                  )
                    switch (((D = F), (F = S()))) {
                      case 40:
                        if (108 != D && 58 == u(H, _ - 1)) {
                          -1 != l((H += s(P(F), '&', '&\f')), '&\f') && ($ = -1);
                          break;
                        }
                      case 34:
                      case 39:
                      case 91:
                        H += P(F);
                        break;
                      case 9:
                      case 10:
                      case 13:
                      case 32:
                        H += (function (t) {
                          for (; (v = k()); )
                            if (v < 33) S();
                            else break;
                          return w(t) > 2 || w(v) > 3 ? '' : ' ';
                        })(D);
                        break;
                      case 92:
                        H += (function (t, e) {
                          for (
                            var r;
                            --e &&
                            S() &&
                            !(v < 48) &&
                            !(v > 102) &&
                            (!(v > 57) || !(v < 65)) &&
                            (!(v > 70) || !(v < 97));

                          );
                          return (r = g + (e < 6 && 32 == k() && 32 == S())), c(y, t, r);
                        })(g - 1, 7);
                        continue;
                      case 47:
                        switch (k()) {
                          case 42:
                          case 47:
                            h(
                              b(
                                (C = (function (t, e) {
                                  for (; S(); )
                                    if (t + v === 57) break;
                                    else if (t + v === 84 && 47 === k()) break;
                                  return '/*' + c(y, e, g - 1) + '*' + o(47 === t ? t : S());
                                })(S(), g)),
                                r,
                                i,
                                R,
                                o(v),
                                c(C, 2, -2),
                                0
                              ),
                              A
                            );
                            break;
                          default:
                            H += '/';
                        }
                        break;
                      case 123 * V:
                        T[E++] = d(H) * $;
                      case 125 * V:
                      case 59:
                      case 0:
                        switch (F) {
                          case 0:
                          case 125:
                            I = 0;
                          case 59 + j:
                            -1 == $ && (H = s(H, /\f/g, '')),
                              B > 0 &&
                                d(H) - _ &&
                                h(
                                  B > 32
                                    ? O(H + ';', n, i, _ - 1)
                                    : O(s(H, ' ', '') + ';', n, i, _ - 2),
                                  A
                                );
                            break;
                          case 59:
                            H += ';';
                          default:
                            if (
                              (h((U = L(H, r, i, E, j, a, T, z, (W = []), (N = []), _)), m),
                              123 === F)
                            ) {
                              if (0 === j) t(H, r, U, U, W, m, _, T, N);
                              else
                                switch (99 === M && 110 === u(H, 3) ? 100 : M) {
                                  case 100:
                                  case 108:
                                  case 109:
                                  case 115:
                                    t(
                                      e,
                                      U,
                                      U,
                                      n && h(L(e, U, U, 0, 0, a, T, z, a, (W = []), _), N),
                                      a,
                                      N,
                                      _,
                                      T,
                                      n ? W : N
                                    );
                                    break;
                                  default:
                                    t(H, U, U, U, [''], N, 0, T, N);
                                }
                            }
                        }
                        (E = j = B = 0), (V = $ = 1), (z = H = ''), (_ = x);
                        break;
                      case 58:
                        (_ = 1 + d(H)), (B = D);
                      default:
                        if (V < 1) {
                          if (123 == F) --V;
                          else if (
                            125 == F &&
                            0 == V++ &&
                            125 == ((v = g > 0 ? u(y, --g) : 0), f--, 10 === v && ((f = 1), p--), v)
                          )
                            continue;
                        }
                        switch (((H += o(F)), F * V)) {
                          case 38:
                            $ = j > 0 ? 1 : ((H += '\f'), -1);
                            break;
                          case 44:
                            (T[E++] = (d(H) - 1) * $), ($ = 1);
                            break;
                          case 64:
                            45 === k() && (H += P(S())),
                              (M = k()),
                              (j = _ =
                                d(
                                  (z = H +=
                                    (function (t) {
                                      for (; !w(k()); ) S();
                                      return c(y, t, g);
                                    })(g))
                                )),
                              F++;
                            break;
                          case 45:
                            45 === D && 2 == d(H) && (V = 0);
                        }
                    }
                  return m;
                })('', null, null, null, [''], (e = T((e = t))), 0, [0], e)),
                (y = ''),
                r),
                M
              );
            };
          m = function (t, e, r, i) {
            (x = r), V(t ? t + '{' + e.styles + '}' : e.styles), i && (I.inserted[e.name] = !0);
          };
          var I = {
            key: A,
            sheet: new i({
              key: A,
              container: a,
              nonce: t.nonce,
              speedy: t.speedy,
              prepend: t.prepend,
              insertionPoint: t.insertionPoint,
            }),
            nonce: t.nonce,
            inserted: j,
            registered: {},
            insert: m,
          };
          return I.sheet.hydrate(_), I;
        };
    },
    9992: function (t, e, r) {
      'use strict';
      function i(t) {
        var e = Object.create(null);
        return function (r) {
          return void 0 === e[r] && (e[r] = t(r)), e[r];
        };
      }
      r.d(e, {
        Z: function () {
          return i;
        },
      });
    },
    7425: function (t, e, r) {
      'use strict';
      r.d(e, {
        E: function () {
          return x;
        },
        T: function () {
          return p;
        },
        _: function () {
          return d;
        },
        a: function () {
          return m;
        },
        c: function () {
          return y;
        },
        h: function () {
          return g;
        },
        w: function () {
          return h;
        },
      });
      var i = r(8867),
        n = r(8234),
        o = r(8142),
        a = function (t) {
          var e = new WeakMap();
          return function (r) {
            if (e.has(r)) return e.get(r);
            var i = t(r);
            return e.set(r, i), i;
          };
        },
        s = r(9169),
        l = r(5365),
        u = r(5225),
        c = i.createContext('undefined' != typeof HTMLElement ? (0, n.Z)({ key: 'css' }) : null);
      c.Provider;
      var d = function () {
          return (0, i.useContext)(c);
        },
        h = function (t) {
          return (0, i.forwardRef)(function (e, r) {
            return t(e, (0, i.useContext)(c), r);
          });
        },
        p = i.createContext({}),
        f = a(function (t) {
          return a(function (e) {
            return 'function' == typeof e ? e(t) : (0, o.Z)({}, t, e);
          });
        }),
        m = function (t) {
          var e = i.useContext(p);
          return (
            t.theme !== e && (e = f(e)(t.theme)),
            i.createElement(p.Provider, { value: e }, t.children)
          );
        },
        g = {}.hasOwnProperty,
        v = '__EMOTION_TYPE_PLEASE_DO_NOT_USE__',
        y = function (t, e) {
          var r = {};
          for (var i in e) g.call(e, i) && (r[i] = e[i]);
          return (r[v] = t), r;
        },
        b = function (t) {
          var e = t.cache,
            r = t.serialized,
            i = t.isStringTag;
          return (
            (0, s.hC)(e, r, i),
            (0, u.L)(function () {
              return (0, s.My)(e, r, i);
            }),
            null
          );
        },
        x = h(function (t, e, r) {
          var n = t.css;
          'string' == typeof n && void 0 !== e.registered[n] && (n = e.registered[n]);
          var o = t[v],
            a = [n],
            u = '';
          'string' == typeof t.className
            ? (u = (0, s.fp)(e.registered, a, t.className))
            : null != t.className && (u = t.className + ' ');
          var c = (0, l.O)(a, void 0, i.useContext(p));
          u += e.key + '-' + c.name;
          var d = {};
          for (var h in t) g.call(t, h) && 'css' !== h && h !== v && (d[h] = t[h]);
          return (
            (d.className = u),
            r && (d.ref = r),
            i.createElement(
              i.Fragment,
              null,
              i.createElement(b, { cache: e, serialized: c, isStringTag: 'string' == typeof o }),
              i.createElement(o, d)
            )
          );
        });
    },
    4335: function (t, e, r) {
      'use strict';
      r.d(e, {
        F4: function () {
          return p;
        },
        xB: function () {
          return d;
        },
      });
      var i,
        n,
        o = r(7425),
        a = r(8867),
        s = r(9169),
        l = r(5225),
        u = r(5365);
      r(8234), r(3501);
      var c = function (t, e) {
        var r = arguments;
        if (null == e || !o.h.call(e, 'css')) return a.createElement.apply(void 0, r);
        var i = r.length,
          n = Array(i);
        (n[0] = o.E), (n[1] = (0, o.c)(t, e));
        for (var s = 2; s < i; s++) n[s] = r[s];
        return a.createElement.apply(null, n);
      };
      (i = c || (c = {})), n || (n = i.JSX || (i.JSX = {}));
      var d = (0, o.w)(function (t, e) {
        var r = t.styles,
          i = (0, u.O)([r], void 0, a.useContext(o.T)),
          n = a.useRef();
        return (
          (0, l.j)(
            function () {
              var t = e.key + '-global',
                r = new e.sheet.constructor({
                  key: t,
                  nonce: e.sheet.nonce,
                  container: e.sheet.container,
                  speedy: e.sheet.isSpeedy,
                }),
                o = !1,
                a = document.querySelector('style[data-emotion="' + t + ' ' + i.name + '"]');
              return (
                e.sheet.tags.length && (r.before = e.sheet.tags[0]),
                null !== a && ((o = !0), a.setAttribute('data-emotion', t), r.hydrate([a])),
                (n.current = [r, o]),
                function () {
                  r.flush();
                }
              );
            },
            [e]
          ),
          (0, l.j)(
            function () {
              var t = n.current,
                r = t[0];
              if (t[1]) {
                t[1] = !1;
                return;
              }
              if ((void 0 !== i.next && (0, s.My)(e, i.next, !0), r.tags.length)) {
                var o = r.tags[r.tags.length - 1].nextElementSibling;
                (r.before = o), r.flush();
              }
              e.insert('', i, r, !1);
            },
            [e, i.name]
          ),
          null
        );
      });
      function h() {
        for (var t = arguments.length, e = Array(t), r = 0; r < t; r++) e[r] = arguments[r];
        return (0, u.O)(e);
      }
      function p() {
        var t = h.apply(void 0, arguments),
          e = 'animation-' + t.name;
        return {
          name: e,
          styles: '@keyframes ' + e + '{' + t.styles + '}',
          anim: 1,
          toString: function () {
            return '_EMO_' + this.name + '_' + this.styles + '_EMO_';
          },
        };
      }
    },
    5365: function (t, e, r) {
      'use strict';
      r.d(e, {
        O: function () {
          return f;
        },
      });
      var i,
        n = {
          animationIterationCount: 1,
          aspectRatio: 1,
          borderImageOutset: 1,
          borderImageSlice: 1,
          borderImageWidth: 1,
          boxFlex: 1,
          boxFlexGroup: 1,
          boxOrdinalGroup: 1,
          columnCount: 1,
          columns: 1,
          flex: 1,
          flexGrow: 1,
          flexPositive: 1,
          flexShrink: 1,
          flexNegative: 1,
          flexOrder: 1,
          gridRow: 1,
          gridRowEnd: 1,
          gridRowSpan: 1,
          gridRowStart: 1,
          gridColumn: 1,
          gridColumnEnd: 1,
          gridColumnSpan: 1,
          gridColumnStart: 1,
          msGridRow: 1,
          msGridRowSpan: 1,
          msGridColumn: 1,
          msGridColumnSpan: 1,
          fontWeight: 1,
          lineHeight: 1,
          opacity: 1,
          order: 1,
          orphans: 1,
          scale: 1,
          tabSize: 1,
          widows: 1,
          zIndex: 1,
          zoom: 1,
          WebkitLineClamp: 1,
          fillOpacity: 1,
          floodOpacity: 1,
          stopOpacity: 1,
          strokeDasharray: 1,
          strokeDashoffset: 1,
          strokeMiterlimit: 1,
          strokeOpacity: 1,
          strokeWidth: 1,
        },
        o = r(9992),
        a = /[A-Z]|^ms/g,
        s = /_EMO_([^_]+?)_([^]*?)_EMO_/g,
        l = function (t) {
          return 45 === t.charCodeAt(1);
        },
        u = function (t) {
          return null != t && 'boolean' != typeof t;
        },
        c = (0, o.Z)(function (t) {
          return l(t) ? t : t.replace(a, '-$&').toLowerCase();
        }),
        d = function (t, e) {
          switch (t) {
            case 'animation':
            case 'animationName':
              if ('string' == typeof e)
                return e.replace(s, function (t, e, r) {
                  return (i = { name: e, styles: r, next: i }), e;
                });
          }
          return 1 === n[t] || l(t) || 'number' != typeof e || 0 === e ? e : e + 'px';
        };
      function h(t, e, r) {
        if (null == r) return '';
        if (void 0 !== r.__emotion_styles) return r;
        switch (typeof r) {
          case 'boolean':
            return '';
          case 'object':
            if (1 === r.anim) return (i = { name: r.name, styles: r.styles, next: i }), r.name;
            if (void 0 !== r.styles) {
              var n = r.next;
              if (void 0 !== n)
                for (; void 0 !== n; )
                  (i = { name: n.name, styles: n.styles, next: i }), (n = n.next);
              return r.styles + ';';
            }
            return (function (t, e, r) {
              var i = '';
              if (Array.isArray(r)) for (var n = 0; n < r.length; n++) i += h(t, e, r[n]) + ';';
              else
                for (var o in r) {
                  var a = r[o];
                  if ('object' != typeof a)
                    null != e && void 0 !== e[a]
                      ? (i += o + '{' + e[a] + '}')
                      : u(a) && (i += c(o) + ':' + d(o, a) + ';');
                  else if (
                    Array.isArray(a) &&
                    'string' == typeof a[0] &&
                    (null == e || void 0 === e[a[0]])
                  )
                    for (var s = 0; s < a.length; s++)
                      u(a[s]) && (i += c(o) + ':' + d(o, a[s]) + ';');
                  else {
                    var l = h(t, e, a);
                    switch (o) {
                      case 'animation':
                      case 'animationName':
                        i += c(o) + ':' + l + ';';
                        break;
                      default:
                        i += o + '{' + l + '}';
                    }
                  }
                }
              return i;
            })(t, e, r);
          case 'function':
            if (void 0 !== t) {
              var o = i,
                a = r(t);
              return (i = o), h(t, e, a);
            }
        }
        if (null == e) return r;
        var s = e[r];
        return void 0 !== s ? s : r;
      }
      var p = /label:\s*([^\s;{]+)\s*(;|$)/g;
      function f(t, e, r) {
        if (1 === t.length && 'object' == typeof t[0] && null !== t[0] && void 0 !== t[0].styles)
          return t[0];
        var n,
          o = !0,
          a = '';
        i = void 0;
        var s = t[0];
        null == s || void 0 === s.raw ? ((o = !1), (a += h(r, e, s))) : (a += s[0]);
        for (var l = 1; l < t.length; l++) (a += h(r, e, t[l])), o && (a += s[l]);
        p.lastIndex = 0;
        for (var u = ''; null !== (n = p.exec(a)); ) u += '-' + n[1];
        return {
          name:
            (function (t) {
              for (var e, r = 0, i = 0, n = t.length; n >= 4; ++i, n -= 4)
                (e =
                  (65535 &
                    (e =
                      (255 & t.charCodeAt(i)) |
                      ((255 & t.charCodeAt(++i)) << 8) |
                      ((255 & t.charCodeAt(++i)) << 16) |
                      ((255 & t.charCodeAt(++i)) << 24))) *
                    1540483477 +
                  (((e >>> 16) * 59797) << 16)),
                  (e ^= e >>> 24),
                  (r =
                    ((65535 & e) * 1540483477 + (((e >>> 16) * 59797) << 16)) ^
                    ((65535 & r) * 1540483477 + (((r >>> 16) * 59797) << 16)));
              switch (n) {
                case 3:
                  r ^= (255 & t.charCodeAt(i + 2)) << 16;
                case 2:
                  r ^= (255 & t.charCodeAt(i + 1)) << 8;
                case 1:
                  (r ^= 255 & t.charCodeAt(i)),
                    (r = (65535 & r) * 1540483477 + (((r >>> 16) * 59797) << 16));
              }
              return (
                (r ^= r >>> 13),
                (
                  ((r = (65535 & r) * 1540483477 + (((r >>> 16) * 59797) << 16)) ^ (r >>> 15)) >>>
                  0
                ).toString(36)
              );
            })(a) + u,
          styles: a,
          next: i,
        };
      }
    },
    5225: function (t, e, r) {
      'use strict';
      r.d(e, {
        L: function () {
          return a;
        },
        j: function () {
          return s;
        },
      });
      var i,
        n = r(8867),
        o =
          !!(i || (i = r.t(n, 2))).useInsertionEffect && (i || (i = r.t(n, 2))).useInsertionEffect,
        a =
          o ||
          function (t) {
            return t();
          },
        s = o || n.useLayoutEffect;
    },
    9169: function (t, e, r) {
      'use strict';
      function i(t, e, r) {
        var i = '';
        return (
          r.split(' ').forEach(function (r) {
            void 0 !== t[r] ? e.push(t[r] + ';') : r && (i += r + ' ');
          }),
          i
        );
      }
      r.d(e, {
        My: function () {
          return o;
        },
        fp: function () {
          return i;
        },
        hC: function () {
          return n;
        },
      });
      var n = function (t, e, r) {
          var i = t.key + '-' + e.name;
          !1 === r && void 0 === t.registered[i] && (t.registered[i] = e.styles);
        },
        o = function (t, e, r) {
          n(t, e, r);
          var i = t.key + '-' + e.name;
          if (void 0 === t.inserted[e.name]) {
            var o = e;
            do t.insert(e === o ? '.' + i : '', o, t.sheet, !0), (o = o.next);
            while (void 0 !== o);
          }
        };
    },
    3501: function (t, e, r) {
      'use strict';
      var i = r(2039),
        n = {
          childContextTypes: !0,
          contextType: !0,
          contextTypes: !0,
          defaultProps: !0,
          displayName: !0,
          getDefaultProps: !0,
          getDerivedStateFromError: !0,
          getDerivedStateFromProps: !0,
          mixins: !0,
          propTypes: !0,
          type: !0,
        },
        o = {
          name: !0,
          length: !0,
          prototype: !0,
          caller: !0,
          callee: !0,
          arguments: !0,
          arity: !0,
        },
        a = {
          $$typeof: !0,
          compare: !0,
          defaultProps: !0,
          displayName: !0,
          propTypes: !0,
          type: !0,
        },
        s = {};
      function l(t) {
        return i.isMemo(t) ? a : s[t.$$typeof] || n;
      }
      (s[i.ForwardRef] = {
        $$typeof: !0,
        render: !0,
        defaultProps: !0,
        displayName: !0,
        propTypes: !0,
      }),
        (s[i.Memo] = a);
      var u = Object.defineProperty,
        c = Object.getOwnPropertyNames,
        d = Object.getOwnPropertySymbols,
        h = Object.getOwnPropertyDescriptor,
        p = Object.getPrototypeOf,
        f = Object.prototype;
      t.exports = function t(e, r, i) {
        if ('string' != typeof r) {
          if (f) {
            var n = p(r);
            n && n !== f && t(e, n, i);
          }
          var a = c(r);
          d && (a = a.concat(d(r)));
          for (var s = l(e), m = l(r), g = 0; g < a.length; ++g) {
            var v = a[g];
            if (!o[v] && !(i && i[v]) && !(m && m[v]) && !(s && s[v])) {
              var y = h(r, v);
              try {
                u(e, v, y);
              } catch (t) {}
            }
          }
        }
        return e;
      };
    },
    8626: function (t, e, r) {
      t = r.nmd(t);
      var i,
        n,
        o,
        a,
        s,
        l,
        u,
        c,
        d,
        h,
        p,
        f = '__lodash_hash_undefined__',
        m = '[object Arguments]',
        g = '[object Function]',
        v = '[object Object]',
        y = /^\[object .+?Constructor\]$/,
        b = /^(?:0|[1-9]\d*)$/,
        x = {};
      (x['[object Float32Array]'] =
        x['[object Float64Array]'] =
        x['[object Int8Array]'] =
        x['[object Int16Array]'] =
        x['[object Int32Array]'] =
        x['[object Uint8Array]'] =
        x['[object Uint8ClampedArray]'] =
        x['[object Uint16Array]'] =
        x['[object Uint32Array]'] =
          !0),
        (x[m] =
          x['[object Array]'] =
          x['[object ArrayBuffer]'] =
          x['[object Boolean]'] =
          x['[object DataView]'] =
          x['[object Date]'] =
          x['[object Error]'] =
          x[g] =
          x['[object Map]'] =
          x['[object Number]'] =
          x[v] =
          x['[object RegExp]'] =
          x['[object Set]'] =
          x['[object String]'] =
          x['[object WeakMap]'] =
            !1);
      var S = 'object' == typeof r.g && r.g && r.g.Object === Object && r.g,
        k = 'object' == typeof self && self && self.Object === Object && self,
        w = S || k || Function('return this')(),
        T = e && !e.nodeType && e,
        P = T && t && !t.nodeType && t,
        A = P && P.exports === T,
        C = A && S.process,
        E = (function () {
          try {
            var t = P && P.require && P.require('util').types;
            if (t) return t;
            return C && C.binding && C.binding('util');
          } catch (t) {}
        })(),
        R = E && E.isTypedArray,
        j = Array.prototype,
        _ = Function.prototype,
        M = Object.prototype,
        B = w['__core-js_shared__'],
        D = _.toString,
        L = M.hasOwnProperty,
        O = (u = /[^.]+$/.exec((B && B.keys && B.keys.IE_PROTO) || '')) ? 'Symbol(src)_1.' + u : '',
        V = M.toString,
        I = D.call(Object),
        $ = RegExp(
          '^' +
            D.call(L)
              .replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
              .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') +
            '$'
        ),
        F = A ? w.Buffer : void 0,
        z = w.Symbol,
        W = w.Uint8Array,
        N = F ? F.allocUnsafe : void 0,
        U =
          ((c = Object.getPrototypeOf),
          (d = Object),
          function (t) {
            return c(d(t));
          }),
        H = Object.create,
        Y = M.propertyIsEnumerable,
        X = j.splice,
        G = z ? z.toStringTag : void 0,
        q = (function () {
          try {
            var t = tp(Object, 'defineProperty');
            return t({}, '', {}), t;
          } catch (t) {}
        })(),
        K = F ? F.isBuffer : void 0,
        Z = Math.max,
        J = Date.now,
        Q = tp(w, 'Map'),
        tt = tp(Object, 'create'),
        te = (function () {
          function t() {}
          return function (e) {
            if (!tP(e)) return {};
            if (H) return H(e);
            t.prototype = e;
            var r = new t();
            return (t.prototype = void 0), r;
          };
        })();
      function tr(t) {
        var e = -1,
          r = null == t ? 0 : t.length;
        for (this.clear(); ++e < r; ) {
          var i = t[e];
          this.set(i[0], i[1]);
        }
      }
      function ti(t) {
        var e = -1,
          r = null == t ? 0 : t.length;
        for (this.clear(); ++e < r; ) {
          var i = t[e];
          this.set(i[0], i[1]);
        }
      }
      function tn(t) {
        var e = -1,
          r = null == t ? 0 : t.length;
        for (this.clear(); ++e < r; ) {
          var i = t[e];
          this.set(i[0], i[1]);
        }
      }
      function to(t) {
        var e = (this.__data__ = new ti(t));
        this.size = e.size;
      }
      function ta(t, e, r) {
        ((void 0 === r || ty(t[e], r)) && (void 0 !== r || e in t)) || tl(t, e, r);
      }
      function ts(t, e) {
        for (var r = t.length; r--; ) if (ty(t[r][0], e)) return r;
        return -1;
      }
      function tl(t, e, r) {
        '__proto__' == e && q
          ? q(t, e, { configurable: !0, enumerable: !0, value: r, writable: !0 })
          : (t[e] = r);
      }
      (tr.prototype.clear = function () {
        (this.__data__ = tt ? tt(null) : {}), (this.size = 0);
      }),
        (tr.prototype.delete = function (t) {
          var e = this.has(t) && delete this.__data__[t];
          return (this.size -= e ? 1 : 0), e;
        }),
        (tr.prototype.get = function (t) {
          var e = this.__data__;
          if (tt) {
            var r = e[t];
            return r === f ? void 0 : r;
          }
          return L.call(e, t) ? e[t] : void 0;
        }),
        (tr.prototype.has = function (t) {
          var e = this.__data__;
          return tt ? void 0 !== e[t] : L.call(e, t);
        }),
        (tr.prototype.set = function (t, e) {
          var r = this.__data__;
          return (this.size += this.has(t) ? 0 : 1), (r[t] = tt && void 0 === e ? f : e), this;
        }),
        (ti.prototype.clear = function () {
          (this.__data__ = []), (this.size = 0);
        }),
        (ti.prototype.delete = function (t) {
          var e = this.__data__,
            r = ts(e, t);
          return !(r < 0) && (r == e.length - 1 ? e.pop() : X.call(e, r, 1), --this.size, !0);
        }),
        (ti.prototype.get = function (t) {
          var e = this.__data__,
            r = ts(e, t);
          return r < 0 ? void 0 : e[r][1];
        }),
        (ti.prototype.has = function (t) {
          return ts(this.__data__, t) > -1;
        }),
        (ti.prototype.set = function (t, e) {
          var r = this.__data__,
            i = ts(r, t);
          return i < 0 ? (++this.size, r.push([t, e])) : (r[i][1] = e), this;
        }),
        (tn.prototype.clear = function () {
          (this.size = 0),
            (this.__data__ = { hash: new tr(), map: new (Q || ti)(), string: new tr() });
        }),
        (tn.prototype.delete = function (t) {
          var e = th(this, t).delete(t);
          return (this.size -= e ? 1 : 0), e;
        }),
        (tn.prototype.get = function (t) {
          return th(this, t).get(t);
        }),
        (tn.prototype.has = function (t) {
          return th(this, t).has(t);
        }),
        (tn.prototype.set = function (t, e) {
          var r = th(this, t),
            i = r.size;
          return r.set(t, e), (this.size += r.size == i ? 0 : 1), this;
        }),
        (to.prototype.clear = function () {
          (this.__data__ = new ti()), (this.size = 0);
        }),
        (to.prototype.delete = function (t) {
          var e = this.__data__,
            r = e.delete(t);
          return (this.size = e.size), r;
        }),
        (to.prototype.get = function (t) {
          return this.__data__.get(t);
        }),
        (to.prototype.has = function (t) {
          return this.__data__.has(t);
        }),
        (to.prototype.set = function (t, e) {
          var r = this.__data__;
          if (r instanceof ti) {
            var i = r.__data__;
            if (!Q || i.length < 199) return i.push([t, e]), (this.size = ++r.size), this;
            r = this.__data__ = new tn(i);
          }
          return r.set(t, e), (this.size = r.size), this;
        });
      var tu = function (t, e, r) {
        for (var i = -1, n = Object(t), o = r(t), a = o.length; a--; ) {
          var s = o[++i];
          if (!1 === e(n[s], s, n)) break;
        }
        return t;
      };
      function tc(t) {
        return null == t
          ? void 0 === t
            ? '[object Undefined]'
            : '[object Null]'
          : G && G in Object(t)
            ? (function (t) {
                var e = L.call(t, G),
                  r = t[G];
                try {
                  t[G] = void 0;
                  var i = !0;
                } catch (t) {}
                var n = V.call(t);
                return i && (e ? (t[G] = r) : delete t[G]), n;
              })(t)
            : V.call(t);
      }
      function td(t) {
        return tA(t) && tc(t) == m;
      }
      function th(t, e) {
        var r,
          i = t.__data__;
        return (
          'string' == (r = typeof e) || 'number' == r || 'symbol' == r || 'boolean' == r
            ? '__proto__' !== e
            : null === e
        )
          ? i['string' == typeof e ? 'string' : 'hash']
          : i.map;
      }
      function tp(t, e) {
        var r = null == t ? void 0 : t[e];
        return !(!tP(r) || (O && O in r)) &&
          (tw(r) ? $ : y).test(
            (function (t) {
              if (null != t) {
                try {
                  return D.call(t);
                } catch (t) {}
                try {
                  return t + '';
                } catch (t) {}
              }
              return '';
            })(r)
          )
          ? r
          : void 0;
      }
      function tf(t, e) {
        var r = typeof t;
        return (
          !!(e = null == e ? 9007199254740991 : e) &&
          ('number' == r || ('symbol' != r && b.test(t))) &&
          t > -1 &&
          t % 1 == 0 &&
          t < e
        );
      }
      function tm(t) {
        var e = t && t.constructor;
        return t === (('function' == typeof e && e.prototype) || M);
      }
      function tg(t, e) {
        if (('constructor' !== e || 'function' != typeof t[e]) && '__proto__' != e) return t[e];
      }
      var tv =
        ((i = q
          ? function (t, e) {
              return q(t, 'toString', {
                configurable: !0,
                enumerable: !1,
                value: function () {
                  return e;
                },
                writable: !0,
              });
            }
          : tj),
        (n = 0),
        (o = 0),
        function () {
          var t = J(),
            e = 16 - (t - o);
          if (((o = t), e > 0)) {
            if (++n >= 800) return arguments[0];
          } else n = 0;
          return i.apply(void 0, arguments);
        });
      function ty(t, e) {
        return t === e || (t != t && e != e);
      }
      var tb = td(
          (function () {
            return arguments;
          })()
        )
          ? td
          : function (t) {
              return tA(t) && L.call(t, 'callee') && !Y.call(t, 'callee');
            },
        tx = Array.isArray;
      function tS(t) {
        return null != t && tT(t.length) && !tw(t);
      }
      var tk =
        K ||
        function () {
          return !1;
        };
      function tw(t) {
        if (!tP(t)) return !1;
        var e = tc(t);
        return (
          e == g ||
          '[object GeneratorFunction]' == e ||
          '[object AsyncFunction]' == e ||
          '[object Proxy]' == e
        );
      }
      function tT(t) {
        return 'number' == typeof t && t > -1 && t % 1 == 0 && t <= 9007199254740991;
      }
      function tP(t) {
        var e = typeof t;
        return null != t && ('object' == e || 'function' == e);
      }
      function tA(t) {
        return null != t && 'object' == typeof t;
      }
      var tC = R
        ? function (t) {
            return R(t);
          }
        : function (t) {
            return tA(t) && tT(t.length) && !!x[tc(t)];
          };
      function tE(t) {
        return tS(t)
          ? (function (t, e) {
              var r = tx(t),
                i = !r && tb(t),
                n = !r && !i && tk(t),
                o = !r && !i && !n && tC(t),
                a = r || i || n || o,
                s = a
                  ? (function (t, e) {
                      for (var r = -1, i = Array(t); ++r < t; ) i[r] = e(r);
                      return i;
                    })(t.length, String)
                  : [],
                l = s.length;
              for (var u in t)
                (e || L.call(t, u)) &&
                  !(
                    a &&
                    ('length' == u ||
                      (n && ('offset' == u || 'parent' == u)) ||
                      (o && ('buffer' == u || 'byteLength' == u || 'byteOffset' == u)) ||
                      tf(u, l))
                  ) &&
                  s.push(u);
              return s;
            })(t, !0)
          : (function (t) {
              if (!tP(t))
                return (function (t) {
                  var e = [];
                  if (null != t) for (var r in Object(t)) e.push(r);
                  return e;
                })(t);
              var e = tm(t),
                r = [];
              for (var i in t) ('constructor' == i && (e || !L.call(t, i))) || r.push(i);
              return r;
            })(t);
      }
      var tR =
        ((h = function (t, e, r, i) {
          !(function t(e, r, i, n, o) {
            e !== r &&
              tu(
                r,
                function (a, s) {
                  if ((o || (o = new to()), tP(a)))
                    (function (t, e, r, i, n, o, a) {
                      var s = tg(t, r),
                        l = tg(e, r),
                        u = a.get(l);
                      if (u) {
                        ta(t, r, u);
                        return;
                      }
                      var c = o ? o(s, l, r + '', t, e, a) : void 0,
                        d = void 0 === c;
                      if (d) {
                        var h,
                          p,
                          f,
                          m = tx(l),
                          g = !m && tk(l),
                          y = !m && !g && tC(l);
                        (c = l),
                          m || g || y
                            ? tx(s)
                              ? (c = s)
                              : tA(s) && tS(s)
                                ? (c = (function (t, e) {
                                    var r = -1,
                                      i = t.length;
                                    for (e || (e = Array(i)); ++r < i; ) e[r] = t[r];
                                    return e;
                                  })(s))
                                : g
                                  ? ((d = !1),
                                    (c = (function (t, e) {
                                      if (e) return t.slice();
                                      var r = t.length,
                                        i = N ? N(r) : new t.constructor(r);
                                      return t.copy(i), i;
                                    })(l, !0)))
                                  : y
                                    ? ((d = !1),
                                      new W((p = new (h = l.buffer).constructor(h.byteLength))).set(
                                        new W(h)
                                      ),
                                      (f = p),
                                      (c = new l.constructor(f, l.byteOffset, l.length)))
                                    : (c = [])
                            : (function (t) {
                                  if (!tA(t) || tc(t) != v) return !1;
                                  var e = U(t);
                                  if (null === e) return !0;
                                  var r = L.call(e, 'constructor') && e.constructor;
                                  return 'function' == typeof r && r instanceof r && D.call(r) == I;
                                })(l) || tb(l)
                              ? ((c = s),
                                tb(s)
                                  ? (c = (function (t, e, r, i) {
                                      var n = !r;
                                      r || (r = {});
                                      for (var o = -1, a = e.length; ++o < a; ) {
                                        var s = e[o],
                                          l = void 0;
                                        void 0 === l && (l = t[s]),
                                          n
                                            ? tl(r, s, l)
                                            : (function (t, e, r) {
                                                var i = t[e];
                                                (L.call(t, e) &&
                                                  ty(i, r) &&
                                                  (void 0 !== r || e in t)) ||
                                                  tl(t, e, r);
                                              })(r, s, l);
                                      }
                                      return r;
                                    })(s, tE(s)))
                                  : (!tP(s) || tw(s)) &&
                                    (c =
                                      'function' != typeof l.constructor || tm(l) ? {} : te(U(l))))
                              : (d = !1);
                      }
                      d && (a.set(l, c), n(c, l, i, o, a), a.delete(l)), ta(t, r, c);
                    })(e, r, s, i, t, n, o);
                  else {
                    var l = n ? n(tg(e, s), a, s + '', e, r, o) : void 0;
                    void 0 === l && (l = a), ta(e, s, l);
                  }
                },
                tE
              );
          })(t, e, r, i);
        }),
        tv(
          ((a = p =
            function (t, e) {
              var r = -1,
                i = e.length,
                n = i > 1 ? e[i - 1] : void 0,
                o = i > 2 ? e[2] : void 0;
              for (
                n = h.length > 3 && 'function' == typeof n ? (i--, n) : void 0,
                  o &&
                    (function (t, e, r) {
                      if (!tP(r)) return !1;
                      var i = typeof e;
                      return (
                        ('number' == i
                          ? !!(tS(r) && tf(e, r.length))
                          : 'string' == i && (e in r)) && ty(r[e], t)
                      );
                    })(e[0], e[1], o) &&
                    ((n = i < 3 ? void 0 : n), (i = 1)),
                  t = Object(t);
                ++r < i;

              ) {
                var a = e[r];
                a && h(t, a, r, n);
              }
              return t;
            }),
          (s = void 0),
          (l = tj),
          (s = Z(void 0 === s ? a.length - 1 : s, 0)),
          function () {
            for (var t = arguments, e = -1, r = Z(t.length - s, 0), i = Array(r); ++e < r; )
              i[e] = t[s + e];
            e = -1;
            for (var n = Array(s + 1); ++e < s; ) n[e] = t[e];
            return (
              (n[s] = l(i)),
              (function (t, e, r) {
                switch (r.length) {
                  case 0:
                    return t.call(e);
                  case 1:
                    return t.call(e, r[0]);
                  case 2:
                    return t.call(e, r[0], r[1]);
                  case 3:
                    return t.call(e, r[0], r[1], r[2]);
                }
                return t.apply(e, r);
              })(a, this, n)
            );
          }),
          p + ''
        ));
      function tj(t) {
        return t;
      }
      t.exports = tR;
    },
    9523: function (t) {
      var e = 'undefined' != typeof Element,
        r = 'function' == typeof Map,
        i = 'function' == typeof Set,
        n = 'function' == typeof ArrayBuffer && !!ArrayBuffer.isView;
      t.exports = function (t, o) {
        try {
          return (function t(o, a) {
            if (o === a) return !0;
            if (o && a && 'object' == typeof o && 'object' == typeof a) {
              var s, l, u, c;
              if (o.constructor !== a.constructor) return !1;
              if (Array.isArray(o)) {
                if ((s = o.length) != a.length) return !1;
                for (l = s; 0 != l--; ) if (!t(o[l], a[l])) return !1;
                return !0;
              }
              if (r && o instanceof Map && a instanceof Map) {
                if (o.size !== a.size) return !1;
                for (c = o.entries(); !(l = c.next()).done; ) if (!a.has(l.value[0])) return !1;
                for (c = o.entries(); !(l = c.next()).done; )
                  if (!t(l.value[1], a.get(l.value[0]))) return !1;
                return !0;
              }
              if (i && o instanceof Set && a instanceof Set) {
                if (o.size !== a.size) return !1;
                for (c = o.entries(); !(l = c.next()).done; ) if (!a.has(l.value[0])) return !1;
                return !0;
              }
              if (n && ArrayBuffer.isView(o) && ArrayBuffer.isView(a)) {
                if ((s = o.length) != a.length) return !1;
                for (l = s; 0 != l--; ) if (o[l] !== a[l]) return !1;
                return !0;
              }
              if (o.constructor === RegExp) return o.source === a.source && o.flags === a.flags;
              if (
                o.valueOf !== Object.prototype.valueOf &&
                'function' == typeof o.valueOf &&
                'function' == typeof a.valueOf
              )
                return o.valueOf() === a.valueOf();
              if (
                o.toString !== Object.prototype.toString &&
                'function' == typeof o.toString &&
                'function' == typeof a.toString
              )
                return o.toString() === a.toString();
              if ((s = (u = Object.keys(o)).length) !== Object.keys(a).length) return !1;
              for (l = s; 0 != l--; ) if (!Object.prototype.hasOwnProperty.call(a, u[l])) return !1;
              if (e && o instanceof Element) return !1;
              for (l = s; 0 != l--; )
                if (
                  (('_owner' !== u[l] && '__v' !== u[l] && '__o' !== u[l]) || !o.$$typeof) &&
                  !t(o[u[l]], a[u[l]])
                )
                  return !1;
              return !0;
            }
            return o != o && a != a;
          })(t, o);
        } catch (t) {
          if ((t.message || '').match(/stack|recursion/i))
            return console.warn('react-fast-compare cannot handle circular refs'), !1;
          throw t;
        }
      };
    },
    5856: function (t, e) {
      'use strict';
      var r = 'function' == typeof Symbol && Symbol.for,
        i = r ? Symbol.for('react.element') : 60103,
        n = r ? Symbol.for('react.portal') : 60106,
        o = r ? Symbol.for('react.fragment') : 60107,
        a = r ? Symbol.for('react.strict_mode') : 60108,
        s = r ? Symbol.for('react.profiler') : 60114,
        l = r ? Symbol.for('react.provider') : 60109,
        u = r ? Symbol.for('react.context') : 60110,
        c = r ? Symbol.for('react.async_mode') : 60111,
        d = r ? Symbol.for('react.concurrent_mode') : 60111,
        h = r ? Symbol.for('react.forward_ref') : 60112,
        p = r ? Symbol.for('react.suspense') : 60113,
        f = r ? Symbol.for('react.suspense_list') : 60120,
        m = r ? Symbol.for('react.memo') : 60115,
        g = r ? Symbol.for('react.lazy') : 60116,
        v = r ? Symbol.for('react.block') : 60121,
        y = r ? Symbol.for('react.fundamental') : 60117,
        b = r ? Symbol.for('react.responder') : 60118,
        x = r ? Symbol.for('react.scope') : 60119;
      function S(t) {
        if ('object' == typeof t && null !== t) {
          var e = t.$$typeof;
          switch (e) {
            case i:
              switch ((t = t.type)) {
                case c:
                case d:
                case o:
                case s:
                case a:
                case p:
                  return t;
                default:
                  switch ((t = t && t.$$typeof)) {
                    case u:
                    case h:
                    case g:
                    case m:
                    case l:
                      return t;
                    default:
                      return e;
                  }
              }
            case n:
              return e;
          }
        }
      }
      function k(t) {
        return S(t) === d;
      }
      (e.AsyncMode = c),
        (e.ConcurrentMode = d),
        (e.ContextConsumer = u),
        (e.ContextProvider = l),
        (e.Element = i),
        (e.ForwardRef = h),
        (e.Fragment = o),
        (e.Lazy = g),
        (e.Memo = m),
        (e.Portal = n),
        (e.Profiler = s),
        (e.StrictMode = a),
        (e.Suspense = p),
        (e.isAsyncMode = function (t) {
          return k(t) || S(t) === c;
        }),
        (e.isConcurrentMode = k),
        (e.isContextConsumer = function (t) {
          return S(t) === u;
        }),
        (e.isContextProvider = function (t) {
          return S(t) === l;
        }),
        (e.isElement = function (t) {
          return 'object' == typeof t && null !== t && t.$$typeof === i;
        }),
        (e.isForwardRef = function (t) {
          return S(t) === h;
        }),
        (e.isFragment = function (t) {
          return S(t) === o;
        }),
        (e.isLazy = function (t) {
          return S(t) === g;
        }),
        (e.isMemo = function (t) {
          return S(t) === m;
        }),
        (e.isPortal = function (t) {
          return S(t) === n;
        }),
        (e.isProfiler = function (t) {
          return S(t) === s;
        }),
        (e.isStrictMode = function (t) {
          return S(t) === a;
        }),
        (e.isSuspense = function (t) {
          return S(t) === p;
        }),
        (e.isValidElementType = function (t) {
          return (
            'string' == typeof t ||
            'function' == typeof t ||
            t === o ||
            t === d ||
            t === s ||
            t === a ||
            t === p ||
            t === f ||
            ('object' == typeof t &&
              null !== t &&
              (t.$$typeof === g ||
                t.$$typeof === m ||
                t.$$typeof === l ||
                t.$$typeof === u ||
                t.$$typeof === h ||
                t.$$typeof === y ||
                t.$$typeof === b ||
                t.$$typeof === x ||
                t.$$typeof === v))
          );
        }),
        (e.typeOf = S);
    },
    2039: function (t, e, r) {
      'use strict';
      t.exports = r(5856);
    },
    8142: function (t, e, r) {
      'use strict';
      function i() {
        return (i = Object.assign
          ? Object.assign.bind()
          : function (t) {
              for (var e = 1; e < arguments.length; e++) {
                var r = arguments[e];
                for (var i in r) ({}).hasOwnProperty.call(r, i) && (t[i] = r[i]);
              }
              return t;
            }).apply(null, arguments);
      }
      r.d(e, {
        Z: function () {
          return i;
        },
      });
    },
    4860: function (t, e, r) {
      'use strict';
      r.d(e, {
        If: function () {
          return o;
        },
        kc: function () {
          return n;
        },
      });
      var i = r(8867);
      let n = (0, i.createContext)({});
      function o() {
        let t = (0, i.useContext)(n);
        if (void 0 === t) throw Error('useColorMode must be used within a ColorModeProvider');
        return t;
      }
      n.displayName = 'ColorModeContext';
    },
    2330: function (t, e, r) {
      'use strict';
      r.d(e, {
        L: function () {
          return o;
        },
        h: function () {
          return a;
        },
      });
      var i = r(8219);
      let [n, o] = (0, r(5938).k)({ strict: !1, name: 'PortalManagerContext' });
      function a(t) {
        let { children: e, zIndex: r } = t;
        return (0, i.jsx)(n, { value: { zIndex: r }, children: e });
      }
      a.displayName = 'PortalManager';
    },
    4166: function (t, e, r) {
      'use strict';
      r.d(e, {
        $: function () {
          return d;
        },
      });
      var i = r(8219),
        n = r(9328),
        o = r(8380),
        a = r(4335),
        s = r(6374),
        l = r(8625),
        u = r(2395);
      let c = (0, a.F4)({
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }),
        d = (0, s.G)((t, e) => {
          let r = (0, l.m)('Spinner', t),
            {
              label: a = 'Loading...',
              thickness: s = '2px',
              speed: d = '0.45s',
              emptyColor: h = 'transparent',
              className: p,
              ...f
            } = (0, n.L)(t),
            m = (0, o.cx)('chakra-spinner', p),
            g = {
              display: 'inline-block',
              borderColor: 'currentColor',
              borderStyle: 'solid',
              borderRadius: '99999px',
              borderWidth: s,
              borderBottomColor: h,
              borderLeftColor: h,
              animation: ''.concat(c, ' ').concat(d, ' linear infinite'),
              ...r,
            };
          return (0, i.jsx)(u.m.div, {
            ref: e,
            __css: g,
            className: m,
            ...f,
            children: a && (0, i.jsx)(u.m.span, { srOnly: !0, children: a }),
          });
        });
      d.displayName = 'Spinner';
    },
    2395: function (t, e, r) {
      'use strict';
      r.d(e, {
        m: function () {
          return E;
        },
      });
      var i = r(3895),
        n = r(474),
        o = r(3075),
        a = r(7861),
        s = r(8142),
        l = r(7425),
        u = r(5365),
        c = r(5225),
        d = r(9169),
        h = r(8867),
        p = r(9992),
        f =
          /^((children|dangerouslySetInnerHTML|key|ref|autoFocus|defaultValue|defaultChecked|innerHTML|suppressContentEditableWarning|suppressHydrationWarning|valueLink|abbr|accept|acceptCharset|accessKey|action|allow|allowUserMedia|allowPaymentRequest|allowFullScreen|allowTransparency|alt|async|autoComplete|autoPlay|capture|cellPadding|cellSpacing|challenge|charSet|checked|cite|classID|className|cols|colSpan|content|contentEditable|contextMenu|controls|controlsList|coords|crossOrigin|data|dateTime|decoding|default|defer|dir|disabled|disablePictureInPicture|disableRemotePlayback|download|draggable|encType|enterKeyHint|fetchpriority|fetchPriority|form|formAction|formEncType|formMethod|formNoValidate|formTarget|frameBorder|headers|height|hidden|high|href|hrefLang|htmlFor|httpEquiv|id|inputMode|integrity|is|keyParams|keyType|kind|label|lang|list|loading|loop|low|marginHeight|marginWidth|max|maxLength|media|mediaGroup|method|min|minLength|multiple|muted|name|nonce|noValidate|open|optimum|pattern|placeholder|playsInline|poster|preload|profile|radioGroup|readOnly|referrerPolicy|rel|required|reversed|role|rows|rowSpan|sandbox|scope|scoped|scrolling|seamless|selected|shape|size|sizes|slot|span|spellCheck|src|srcDoc|srcLang|srcSet|start|step|style|summary|tabIndex|target|title|translate|type|useMap|value|width|wmode|wrap|about|datatype|inlist|prefix|property|resource|typeof|vocab|autoCapitalize|autoCorrect|autoSave|color|incremental|fallback|inert|itemProp|itemScope|itemType|itemID|itemRef|on|option|results|security|unselectable|accentHeight|accumulate|additive|alignmentBaseline|allowReorder|alphabetic|amplitude|arabicForm|ascent|attributeName|attributeType|autoReverse|azimuth|baseFrequency|baselineShift|baseProfile|bbox|begin|bias|by|calcMode|capHeight|clip|clipPathUnits|clipPath|clipRule|colorInterpolation|colorInterpolationFilters|colorProfile|colorRendering|contentScriptType|contentStyleType|cursor|cx|cy|d|decelerate|descent|diffuseConstant|direction|display|divisor|dominantBaseline|dur|dx|dy|edgeMode|elevation|enableBackground|end|exponent|externalResourcesRequired|fill|fillOpacity|fillRule|filter|filterRes|filterUnits|floodColor|floodOpacity|focusable|fontFamily|fontSize|fontSizeAdjust|fontStretch|fontStyle|fontVariant|fontWeight|format|from|fr|fx|fy|g1|g2|glyphName|glyphOrientationHorizontal|glyphOrientationVertical|glyphRef|gradientTransform|gradientUnits|hanging|horizAdvX|horizOriginX|ideographic|imageRendering|in|in2|intercept|k|k1|k2|k3|k4|kernelMatrix|kernelUnitLength|kerning|keyPoints|keySplines|keyTimes|lengthAdjust|letterSpacing|lightingColor|limitingConeAngle|local|markerEnd|markerMid|markerStart|markerHeight|markerUnits|markerWidth|mask|maskContentUnits|maskUnits|mathematical|mode|numOctaves|offset|opacity|operator|order|orient|orientation|origin|overflow|overlinePosition|overlineThickness|panose1|paintOrder|pathLength|patternContentUnits|patternTransform|patternUnits|pointerEvents|points|pointsAtX|pointsAtY|pointsAtZ|preserveAlpha|preserveAspectRatio|primitiveUnits|r|radius|refX|refY|renderingIntent|repeatCount|repeatDur|requiredExtensions|requiredFeatures|restart|result|rotate|rx|ry|scale|seed|shapeRendering|slope|spacing|specularConstant|specularExponent|speed|spreadMethod|startOffset|stdDeviation|stemh|stemv|stitchTiles|stopColor|stopOpacity|strikethroughPosition|strikethroughThickness|string|stroke|strokeDasharray|strokeDashoffset|strokeLinecap|strokeLinejoin|strokeMiterlimit|strokeOpacity|strokeWidth|surfaceScale|systemLanguage|tableValues|targetX|targetY|textAnchor|textDecoration|textRendering|textLength|to|transform|u1|u2|underlinePosition|underlineThickness|unicode|unicodeBidi|unicodeRange|unitsPerEm|vAlphabetic|vHanging|vIdeographic|vMathematical|values|vectorEffect|version|vertAdvY|vertOriginX|vertOriginY|viewBox|viewTarget|visibility|widths|wordSpacing|writingMode|x|xHeight|x1|x2|xChannelSelector|xlinkActuate|xlinkArcrole|xlinkHref|xlinkRole|xlinkShow|xlinkTitle|xlinkType|xmlBase|xmlns|xmlnsXlink|xmlLang|xmlSpace|y|y1|y2|yChannelSelector|z|zoomAndPan|for|class|autofocus)|(([Dd][Aa][Tt][Aa]|[Aa][Rr][Ii][Aa]|x)-.*))$/,
        m = (0, p.Z)(function (t) {
          return (
            f.test(t) ||
            (111 === t.charCodeAt(0) && 110 === t.charCodeAt(1) && 91 > t.charCodeAt(2))
          );
        }),
        g = function (t) {
          return 'theme' !== t;
        },
        v = function (t) {
          return 'string' == typeof t && t.charCodeAt(0) > 96 ? m : g;
        },
        y = function (t, e, r) {
          var i;
          if (e) {
            var n = e.shouldForwardProp;
            i =
              t.__emotion_forwardProp && n
                ? function (e) {
                    return t.__emotion_forwardProp(e) && n(e);
                  }
                : n;
          }
          return 'function' != typeof i && r && (i = t.__emotion_forwardProp), i;
        },
        b = function (t) {
          var e = t.cache,
            r = t.serialized,
            i = t.isStringTag;
          return (
            (0, d.hC)(e, r, i),
            (0, c.L)(function () {
              return (0, d.My)(e, r, i);
            }),
            null
          );
        },
        x = function t(e, r) {
          var i,
            n,
            o = e.__emotion_real === e,
            a = (o && e.__emotion_base) || e;
          void 0 !== r && ((i = r.label), (n = r.target));
          var c = y(e, r, o),
            p = c || v(a),
            f = !p('as');
          return function () {
            var m = arguments,
              g = o && void 0 !== e.__emotion_styles ? e.__emotion_styles.slice(0) : [];
            if ((void 0 !== i && g.push('label:' + i + ';'), null == m[0] || void 0 === m[0].raw))
              g.push.apply(g, m);
            else {
              var x = m[0];
              g.push(x[0]);
              for (var S = m.length, k = 1; k < S; k++) g.push(m[k], x[k]);
            }
            var w = (0, l.w)(function (t, e, r) {
              var i = (f && t.as) || a,
                o = '',
                s = [],
                m = t;
              if (null == t.theme) {
                for (var y in ((m = {}), t)) m[y] = t[y];
                m.theme = h.useContext(l.T);
              }
              'string' == typeof t.className
                ? (o = (0, d.fp)(e.registered, s, t.className))
                : null != t.className && (o = t.className + ' ');
              var x = (0, u.O)(g.concat(s), e.registered, m);
              (o += e.key + '-' + x.name), void 0 !== n && (o += ' ' + n);
              var S = f && void 0 === c ? v(i) : p,
                k = {};
              for (var w in t) (!f || 'as' !== w) && S(w) && (k[w] = t[w]);
              return (
                (k.className = o),
                r && (k.ref = r),
                h.createElement(
                  h.Fragment,
                  null,
                  h.createElement(b, {
                    cache: e,
                    serialized: x,
                    isStringTag: 'string' == typeof i,
                  }),
                  h.createElement(i, k)
                )
              );
            });
            return (
              (w.displayName =
                void 0 !== i
                  ? i
                  : 'Styled(' +
                    ('string' == typeof a ? a : a.displayName || a.name || 'Component') +
                    ')'),
              (w.defaultProps = e.defaultProps),
              (w.__emotion_real = w),
              (w.__emotion_base = a),
              (w.__emotion_styles = g),
              (w.__emotion_forwardProp = c),
              Object.defineProperty(w, 'toString', {
                value: function () {
                  return '.' + n;
                },
              }),
              (w.withComponent = function (e, i) {
                return t(e, (0, s.Z)({}, r, i, { shouldForwardProp: y(w, i, !0) })).apply(
                  void 0,
                  g
                );
              }),
              w
            );
          };
        }.bind(null);
      [
        'a',
        'abbr',
        'address',
        'area',
        'article',
        'aside',
        'audio',
        'b',
        'base',
        'bdi',
        'bdo',
        'big',
        'blockquote',
        'body',
        'br',
        'button',
        'canvas',
        'caption',
        'cite',
        'code',
        'col',
        'colgroup',
        'data',
        'datalist',
        'dd',
        'del',
        'details',
        'dfn',
        'dialog',
        'div',
        'dl',
        'dt',
        'em',
        'embed',
        'fieldset',
        'figcaption',
        'figure',
        'footer',
        'form',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'head',
        'header',
        'hgroup',
        'hr',
        'html',
        'i',
        'iframe',
        'img',
        'input',
        'ins',
        'kbd',
        'keygen',
        'label',
        'legend',
        'li',
        'link',
        'main',
        'map',
        'mark',
        'marquee',
        'menu',
        'menuitem',
        'meta',
        'meter',
        'nav',
        'noscript',
        'object',
        'ol',
        'optgroup',
        'option',
        'output',
        'p',
        'param',
        'picture',
        'pre',
        'progress',
        'q',
        'rp',
        'rt',
        'ruby',
        's',
        'samp',
        'script',
        'section',
        'select',
        'small',
        'source',
        'span',
        'strong',
        'style',
        'sub',
        'summary',
        'sup',
        'table',
        'tbody',
        'td',
        'textarea',
        'tfoot',
        'th',
        'thead',
        'time',
        'title',
        'tr',
        'track',
        'u',
        'ul',
        'var',
        'video',
        'wbr',
        'circle',
        'clipPath',
        'defs',
        'ellipse',
        'foreignObject',
        'g',
        'image',
        'line',
        'linearGradient',
        'mask',
        'path',
        'pattern',
        'polygon',
        'polyline',
        'radialGradient',
        'rect',
        'stop',
        'svg',
        'text',
        'tspan',
      ].forEach(function (t) {
        x[t] = x(t);
      });
      let S = new Set([
          ...i.cC,
          'textStyle',
          'layerStyle',
          'apply',
          'noOfLines',
          'focusBorderColor',
          'errorBorderColor',
          'as',
          '__css',
          'css',
          'sx',
        ]),
        k = new Set(['htmlWidth', 'htmlHeight', 'htmlSize', 'htmlTranslate']);
      function w(t) {
        return (k.has(t) || !S.has(t)) && '_' !== t[0];
      }
      var T = r(4860);
      let P = x.default || x,
        A = (t) => {
          let { baseStyle: e } = t;
          return (t) => {
            let { theme: r, css: s, __css: l, sx: u, ...c } = t,
              [d] = (function (t, ...e) {
                let r = Object.getOwnPropertyDescriptors(t),
                  i = Object.keys(r),
                  n = (t) => {
                    let e = {};
                    for (let i = 0; i < t.length; i++) {
                      let n = t[i];
                      r[n] && (Object.defineProperty(e, n, r[n]), delete r[n]);
                    }
                    return e;
                  };
                return e.map((t) => n(Array.isArray(t) ? t : i.filter(t))).concat(n(i));
              })(c, i.ZR),
              h = (function (t, ...e) {
                if (null == t) throw TypeError('Cannot convert undefined or null to object');
                let r = { ...t };
                for (let t of e)
                  if (null != t)
                    for (let e in t)
                      Object.prototype.hasOwnProperty.call(t, e) &&
                        (e in r && delete r[e], (r[e] = t[e]));
                return r;
              })({}, l, (0, o.P)(e, t), (0, a.o)(d), u),
              p = (0, n.i)(h)(t.theme);
            return s ? [p, s] : p;
          };
        };
      function C(t, e) {
        let { baseStyle: r, ...i } = null != e ? e : {};
        i.shouldForwardProp || (i.shouldForwardProp = w);
        let n = A({ baseStyle: r }),
          o = P(t, i)(n);
        return (0, h.forwardRef)(function (t, e) {
          let { children: r, ...i } = t,
            { colorMode: n, forced: a } = (0, T.If)();
          return (0, h.createElement)(o, { ref: e, 'data-theme': a ? n : void 0, ...i }, r);
        });
      }
      let E = (function () {
        let t = new Map();
        return new Proxy(C, {
          apply: (t, e, r) => C(...r),
          get: (e, r) => (t.has(r) || t.set(r, C(r)), t.get(r)),
        });
      })();
    },
    6374: function (t, e, r) {
      'use strict';
      r.d(e, {
        G: function () {
          return n;
        },
      });
      var i = r(8867);
      function n(t) {
        return (0, i.forwardRef)(t);
      }
    },
    847: function (t, e, r) {
      'use strict';
      r.d(e, {
        uP: function () {
          return a;
        },
      });
      var i = r(7425),
        n = r(8867),
        o = r(4860);
      function a() {
        let t = (0, o.If)(),
          e = (function () {
            let t = (0, n.useContext)(i.T);
            if (!t)
              throw Error(
                'useTheme: `theme` is undefined. Seems you forgot to wrap your app in `<ChakraProvider />` or `<ThemeProvider />`'
              );
            return t;
          })();
        return { ...t, theme: e };
      }
    },
    8625: function (t, e, r) {
      'use strict';
      r.d(e, {
        j: function () {
          return m;
        },
        m: function () {
          return f;
        },
      });
      var i = r(1055),
        n = r(5885),
        o = r(3075),
        a = r(8626),
        s = r(6506),
        l = r(7861),
        u = r(5670),
        c = r(8867),
        d = r(9523),
        h = r(847);
      function p(t) {
        var e;
        let r = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
          { styleConfig: p, ...f } = r,
          { theme: m, colorMode: g } = (0, h.uP)(),
          v = t ? (0, s.W)(m, 'components.'.concat(t)) : void 0,
          y = p || v,
          b = a(
            { theme: m, colorMode: g },
            null !== (e = null == y ? void 0 : y.defaultProps) && void 0 !== e ? e : {},
            (0, l.o)((0, u.C)(f, ['children'])),
            (t, e) => (t ? void 0 : e)
          ),
          x = (0, c.useRef)({});
        if (y) {
          let t = ((t) => {
            let { variant: e, size: r, theme: s } = t,
              l = (function (t) {
                let e = t.__breakpoints;
                return function (t, r, s, l) {
                  var u;
                  if (!e) return;
                  let c = {},
                    d =
                      ((u = e.toArrayValue),
                      Array.isArray(s) ? s : (0, i.Kn)(s) ? u(s) : null != s ? [s] : void 0);
                  if (!d) return c;
                  let h = d.length,
                    p = 1 === h,
                    f = !!t.parts;
                  for (let i = 0; i < h; i++) {
                    let s = e.details[i],
                      u =
                        e.details[
                          (function (t, e) {
                            for (let r = e + 1; r < t.length; r++) if (null != t[r]) return r;
                            return -1;
                          })(d, i)
                        ],
                      h = (0, n.Y)(s.minW, u?._minW),
                      m = (0, o.P)(t[r]?.[d[i]], l);
                    if (m) {
                      if (f) {
                        t.parts?.forEach((t) => {
                          a(c, { [t]: p ? m[t] : { [h]: m[t] } });
                        });
                        continue;
                      }
                      if (!f) {
                        p ? a(c, m) : (c[h] = m);
                        continue;
                      }
                      c[h] = m;
                    }
                  }
                  return c;
                };
              })(s);
            return a(
              {},
              (0, o.P)(y.baseStyle ?? {}, t),
              l(y, 'sizes', r, t),
              l(y, 'variants', e, t)
            );
          })(b);
          d(x.current, t) || (x.current = t);
        }
        return x.current;
      }
      function f(t) {
        let e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
        return p(t, e);
      }
      function m(t) {
        let e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
        return p(t, e);
      }
    },
    1419: function (t, e, r) {
      'use strict';
      r.d(e, {
        C: function () {
          return C;
        },
      });
      var i = r(8219),
        n = r(9328),
        o = r(4073),
        a = r(8380),
        s = r(5938),
        l = r(6374),
        u = r(8625),
        c = r(2395);
      let d = {
          path: (0, i.jsxs)('g', {
            stroke: 'currentColor',
            strokeWidth: '1.5',
            children: [
              (0, i.jsx)('path', {
                strokeLinecap: 'round',
                fill: 'none',
                d: 'M9,9a3,3,0,1,1,4,2.829,1.5,1.5,0,0,0-1,1.415V14.25',
              }),
              (0, i.jsx)('path', {
                fill: 'currentColor',
                strokeLinecap: 'round',
                d: 'M12,17.25a.375.375,0,1,0,.375.375A.375.375,0,0,0,12,17.25h0',
              }),
              (0, i.jsx)('circle', {
                fill: 'none',
                strokeMiterlimit: '10',
                cx: '12',
                cy: '12',
                r: '11.25',
              }),
            ],
          }),
          viewBox: '0 0 24 24',
        },
        h = (0, l.G)((t, e) => {
          let {
              as: r,
              viewBox: n,
              color: o = 'currentColor',
              focusable: s = !1,
              children: l,
              className: h,
              __css: p,
              ...f
            } = t,
            m = (0, a.cx)('chakra-icon', h),
            g = (0, u.m)('Icon', t),
            v = {
              ref: e,
              focusable: s,
              className: m,
              __css: {
                w: '1em',
                h: '1em',
                display: 'inline-block',
                lineHeight: '1em',
                flexShrink: 0,
                color: o,
                ...p,
                ...g,
              },
            },
            y = null != n ? n : d.viewBox;
          if (r && 'string' != typeof r) return (0, i.jsx)(c.m.svg, { as: r, ...v, ...f });
          let b = null != l ? l : d.path;
          return (0, i.jsx)(c.m.svg, {
            verticalAlign: 'middle',
            viewBox: y,
            ...v,
            ...f,
            children: b,
          });
        });
      function p(t) {
        return (0, i.jsx)(h, {
          viewBox: '0 0 24 24',
          ...t,
          children: (0, i.jsx)('path', {
            fill: 'currentColor',
            d: 'M11.983,0a12.206,12.206,0,0,0-8.51,3.653A11.8,11.8,0,0,0,0,12.207,11.779,11.779,0,0,0,11.8,24h.214A12.111,12.111,0,0,0,24,11.791h0A11.766,11.766,0,0,0,11.983,0ZM10.5,16.542a1.476,1.476,0,0,1,1.449-1.53h.027a1.527,1.527,0,0,1,1.523,1.47,1.475,1.475,0,0,1-1.449,1.53h-.027A1.529,1.529,0,0,1,10.5,16.542ZM11,12.5v-6a1,1,0,0,1,2,0v6a1,1,0,1,1-2,0Z',
          }),
        });
      }
      h.displayName = 'Icon';
      var f = r(4166);
      let [m, g] = (0, s.k)({
          name: 'AlertContext',
          hookName: 'useAlertContext',
          providerName: '<Alert />',
        }),
        [v, y] = (0, s.k)({
          name: 'AlertStylesContext',
          hookName: 'useAlertStyles',
          providerName: '<Alert />',
        }),
        b = {
          info: {
            icon: function (t) {
              return (0, i.jsx)(h, {
                viewBox: '0 0 24 24',
                ...t,
                children: (0, i.jsx)('path', {
                  fill: 'currentColor',
                  d: 'M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Zm.25,5a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,12.25,5ZM14.5,18.5h-4a1,1,0,0,1,0-2h.75a.25.25,0,0,0,.25-.25v-4.5a.25.25,0,0,0-.25-.25H10.5a1,1,0,0,1,0-2h1a2,2,0,0,1,2,2v4.75a.25.25,0,0,0,.25.25h.75a1,1,0,1,1,0,2Z',
                }),
              });
            },
            colorScheme: 'blue',
          },
          warning: { icon: p, colorScheme: 'orange' },
          success: {
            icon: function (t) {
              return (0, i.jsx)(h, {
                viewBox: '0 0 24 24',
                ...t,
                children: (0, i.jsx)('path', {
                  fill: 'currentColor',
                  d: 'M12,0A12,12,0,1,0,24,12,12.014,12.014,0,0,0,12,0Zm6.927,8.2-6.845,9.289a1.011,1.011,0,0,1-1.43.188L5.764,13.769a1,1,0,1,1,1.25-1.562l4.076,3.261,6.227-8.451A1,1,0,1,1,18.927,8.2Z',
                }),
              });
            },
            colorScheme: 'green',
          },
          error: { icon: p, colorScheme: 'red' },
          loading: { icon: f.$, colorScheme: 'blue' },
        },
        x = (0, l.G)(function (t, e) {
          var r;
          let { status: s = 'info', addRole: l = !0, ...d } = (0, n.L)(t),
            h = null !== (r = t.colorScheme) && void 0 !== r ? r : b[s].colorScheme,
            p = (0, u.j)('Alert', { ...t, colorScheme: h }),
            f = (0, o.k0)({
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              ...p.container,
            });
          return (0, i.jsx)(m, {
            value: { status: s },
            children: (0, i.jsx)(v, {
              value: p,
              children: (0, i.jsx)(c.m.div, {
                'data-status': s,
                role: l ? 'alert' : void 0,
                ref: e,
                ...d,
                className: (0, a.cx)('chakra-alert', t.className),
                __css: f,
              }),
            }),
          });
        });
      function S(t) {
        let { status: e } = g(),
          r = b[e].icon,
          n = y(),
          o = 'loading' === e ? n.spinner : n.icon;
        return (0, i.jsx)(c.m.span, {
          display: 'inherit',
          'data-status': e,
          ...t,
          className: (0, a.cx)('chakra-alert__icon', t.className),
          __css: o,
          children: t.children || (0, i.jsx)(r, { h: '100%', w: '100%' }),
        });
      }
      (x.displayName = 'Alert'), (S.displayName = 'AlertIcon');
      let k = (0, l.G)(function (t, e) {
        let r = y(),
          { status: n } = g();
        return (0, i.jsx)(c.m.div, {
          ref: e,
          'data-status': n,
          ...t,
          className: (0, a.cx)('chakra-alert__title', t.className),
          __css: r.title,
        });
      });
      k.displayName = 'AlertTitle';
      let w = (0, l.G)(function (t, e) {
        let { status: r } = g(),
          n = y(),
          s = (0, o.k0)({ display: 'inline', ...n.description });
        return (0, i.jsx)(c.m.div, {
          ref: e,
          'data-status': r,
          ...t,
          className: (0, a.cx)('chakra-alert__desc', t.className),
          __css: s,
        });
      });
      function T(t) {
        return (0, i.jsx)(h, {
          focusable: 'false',
          'aria-hidden': !0,
          ...t,
          children: (0, i.jsx)('path', {
            fill: 'currentColor',
            d: 'M.439,21.44a1.5,1.5,0,0,0,2.122,2.121L11.823,14.3a.25.25,0,0,1,.354,0l9.262,9.263a1.5,1.5,0,1,0,2.122-2.121L14.3,12.177a.25.25,0,0,1,0-.354l9.263-9.262A1.5,1.5,0,0,0,21.439.44L12.177,9.7a.25.25,0,0,1-.354,0L2.561.44A1.5,1.5,0,0,0,.439,2.561L9.7,11.823a.25.25,0,0,1,0,.354Z',
          }),
        });
      }
      w.displayName = 'AlertDescription';
      let P = (0, l.G)(function (t, e) {
        let r = (0, u.m)('CloseButton', t),
          { children: o, isDisabled: a, __css: s, ...l } = (0, n.L)(t);
        return (0, i.jsx)(c.m.button, {
          type: 'button',
          'aria-label': 'Close',
          ref: e,
          disabled: a,
          __css: {
            outline: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            ...r,
            ...s,
          },
          ...l,
          children: o || (0, i.jsx)(T, { width: '1em', height: '1em' }),
        });
      });
      P.displayName = 'CloseButton';
      let A = (t) => {
        let {
            status: e,
            variant: r = 'solid',
            id: n,
            title: o,
            isClosable: a,
            onClose: s,
            description: l,
            colorScheme: u,
            icon: d,
          } = t,
          h = n
            ? {
                root: 'toast-'.concat(n),
                title: 'toast-'.concat(n, '-title'),
                description: 'toast-'.concat(n, '-description'),
              }
            : void 0;
        return (0, i.jsxs)(x, {
          addRole: !1,
          status: e,
          variant: r,
          id: null == h ? void 0 : h.root,
          alignItems: 'start',
          borderRadius: 'md',
          boxShadow: 'lg',
          paddingEnd: 8,
          textAlign: 'start',
          width: 'auto',
          colorScheme: u,
          children: [
            (0, i.jsx)(S, { children: d }),
            (0, i.jsxs)(c.m.div, {
              flex: '1',
              maxWidth: '100%',
              children: [
                o && (0, i.jsx)(k, { id: null == h ? void 0 : h.title, children: o }),
                l &&
                  (0, i.jsx)(w, {
                    id: null == h ? void 0 : h.description,
                    display: 'block',
                    children: l,
                  }),
              ],
            }),
            a &&
              (0, i.jsx)(P, { size: 'sm', onClick: s, position: 'absolute', insetEnd: 1, top: 1 }),
          ],
        });
      };
      function C() {
        let t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
          { render: e, toastComponent: r = A } = t;
        return (n) => ('function' == typeof e ? e({ ...n, ...t }) : (0, i.jsx)(r, { ...n, ...t }));
      }
    },
    9118: function (t, e, r) {
      'use strict';
      let i;
      r.d(e, {
        Qi: function () {
          return oN;
        },
        VW: function () {
          return oH;
        },
        OX: function () {
          return oU;
        },
      });
      var n,
        o,
        a,
        s,
        l = r(8219),
        u = r(5938),
        c = r(8867);
      let d = (0, c.createContext)({});
      function h(t) {
        let e = (0, c.useRef)(null);
        return null === e.current && (e.current = t()), e.current;
      }
      let p = (0, c.createContext)(null),
        f = (0, c.createContext)({
          transformPagePoint: (t) => t,
          isStatic: !1,
          reducedMotion: 'never',
        });
      class m extends c.Component {
        getSnapshotBeforeUpdate(t) {
          let e = this.props.childRef.current;
          if (e && t.isPresent && !this.props.isPresent) {
            let t = this.props.sizeRef.current;
            (t.height = e.offsetHeight || 0),
              (t.width = e.offsetWidth || 0),
              (t.top = e.offsetTop),
              (t.left = e.offsetLeft);
          }
          return null;
        }
        componentDidUpdate() {}
        render() {
          return this.props.children;
        }
      }
      function g(t) {
        let { children: e, isPresent: r } = t,
          i = (0, c.useId)(),
          n = (0, c.useRef)(null),
          o = (0, c.useRef)({ width: 0, height: 0, top: 0, left: 0 }),
          { nonce: a } = (0, c.useContext)(f);
        return (
          (0, c.useInsertionEffect)(() => {
            let { width: t, height: e, top: s, left: l } = o.current;
            if (r || !n.current || !t || !e) return;
            n.current.dataset.motionPopId = i;
            let u = document.createElement('style');
            return (
              a && (u.nonce = a),
              document.head.appendChild(u),
              u.sheet &&
                u.sheet.insertRule(
                  '\n          [data-motion-pop-id="'
                    .concat(
                      i,
                      '"] {\n            position: absolute !important;\n            width: '
                    )
                    .concat(t, 'px !important;\n            height: ')
                    .concat(e, 'px !important;\n            top: ')
                    .concat(s, 'px !important;\n            left: ')
                    .concat(l, 'px !important;\n          }\n        ')
                ),
              () => {
                document.head.removeChild(u);
              }
            );
          }, [r]),
          (0, l.jsx)(m, {
            isPresent: r,
            childRef: n,
            sizeRef: o,
            children: c.cloneElement(e, { ref: n }),
          })
        );
      }
      let v = (t) => {
        let {
            children: e,
            initial: r,
            isPresent: i,
            onExitComplete: n,
            custom: o,
            presenceAffectsLayout: a,
            mode: s,
          } = t,
          u = h(y),
          d = (0, c.useId)(),
          f = (0, c.useCallback)(
            (t) => {
              for (let e of (u.set(t, !0), u.values())) if (!e) return;
              n && n();
            },
            [u, n]
          ),
          m = (0, c.useMemo)(
            () => ({
              id: d,
              initial: r,
              isPresent: i,
              custom: o,
              onExitComplete: f,
              register: (t) => (u.set(t, !1), () => u.delete(t)),
            }),
            a ? [Math.random(), f] : [i, f]
          );
        return (
          (0, c.useMemo)(() => {
            u.forEach((t, e) => u.set(e, !1));
          }, [i]),
          c.useEffect(() => {
            i || u.size || !n || n();
          }, [i]),
          'popLayout' === s && (e = (0, l.jsx)(g, { isPresent: i, children: e })),
          (0, l.jsx)(p.Provider, { value: m, children: e })
        );
      };
      function y() {
        return new Map();
      }
      function b(t = !0) {
        let e = (0, c.useContext)(p);
        if (null === e) return [!0, null];
        let { isPresent: r, onExitComplete: i, register: n } = e,
          o = (0, c.useId)();
        (0, c.useEffect)(() => {
          t && n(o);
        }, [t]);
        let a = (0, c.useCallback)(() => t && i && i(o), [o, i, t]);
        return !r && i ? [!1, a] : [!0];
      }
      let x = (t) => t.key || '';
      function S(t) {
        let e = [];
        return (
          c.Children.forEach(t, (t) => {
            (0, c.isValidElement)(t) && e.push(t);
          }),
          e
        );
      }
      let k = 'undefined' != typeof window,
        w = k ? c.useLayoutEffect : c.useEffect,
        T = (t) => {
          let {
              children: e,
              custom: r,
              initial: i = !0,
              onExitComplete: n,
              presenceAffectsLayout: o = !0,
              mode: a = 'sync',
              propagate: s = !1,
            } = t,
            [u, p] = b(s),
            f = (0, c.useMemo)(() => S(e), [e]),
            m = s && !u ? [] : f.map(x),
            g = (0, c.useRef)(!0),
            y = (0, c.useRef)(f),
            k = h(() => new Map()),
            [T, P] = (0, c.useState)(f),
            [A, C] = (0, c.useState)(f);
          w(() => {
            (g.current = !1), (y.current = f);
            for (let t = 0; t < A.length; t++) {
              let e = x(A[t]);
              m.includes(e) ? k.delete(e) : !0 !== k.get(e) && k.set(e, !1);
            }
          }, [A, m.length, m.join('-')]);
          let E = [];
          if (f !== T) {
            let t = [...f];
            for (let e = 0; e < A.length; e++) {
              let r = A[e],
                i = x(r);
              m.includes(i) || (t.splice(e, 0, r), E.push(r));
            }
            'wait' === a && E.length && (t = E), C(S(t)), P(f);
            return;
          }
          let { forceRender: R } = (0, c.useContext)(d);
          return (0, l.jsx)(l.Fragment, {
            children: A.map((t) => {
              let e = x(t),
                c = (!s || !!u) && (f === A || m.includes(e));
              return (0, l.jsx)(
                v,
                {
                  isPresent: c,
                  initial: (!g.current || !!i) && void 0,
                  custom: c ? void 0 : r,
                  presenceAffectsLayout: o,
                  mode: a,
                  onExitComplete: c
                    ? void 0
                    : () => {
                        if (!k.has(e)) return;
                        k.set(e, !0);
                        let t = !0;
                        k.forEach((e) => {
                          e || (t = !1);
                        }),
                          t && (null == R || R(), C(y.current), s && (null == p || p()), n && n());
                      },
                  children: t,
                },
                e
              );
            }),
          });
        },
        P = (t, e) => {
          let r = (0, c.useRef)(!1),
            i = (0, c.useRef)(!1);
          (0, c.useEffect)(() => {
            if (r.current && i.current) return t();
            i.current = !0;
          }, e),
            (0, c.useEffect)(
              () => (
                (r.current = !0),
                () => {
                  r.current = !1;
                }
              ),
              []
            );
        };
      var A = r(3075);
      function C(t) {
        return null !== t && 'object' == typeof t && 'function' == typeof t.start;
      }
      let E = (t) => Array.isArray(t);
      function R(t, e) {
        if (!Array.isArray(e)) return !1;
        let r = e.length;
        if (r !== t.length) return !1;
        for (let i = 0; i < r; i++) if (e[i] !== t[i]) return !1;
        return !0;
      }
      function j(t) {
        return 'string' == typeof t || Array.isArray(t);
      }
      function _(t) {
        let e = [{}, {}];
        return (
          null == t ||
            t.values.forEach((t, r) => {
              (e[0][r] = t.get()), (e[1][r] = t.getVelocity());
            }),
          e
        );
      }
      function M(t, e, r, i) {
        if ('function' == typeof e) {
          let [n, o] = _(i);
          e = e(void 0 !== r ? r : t.custom, n, o);
        }
        if (('string' == typeof e && (e = t.variants && t.variants[e]), 'function' == typeof e)) {
          let [n, o] = _(i);
          e = e(void 0 !== r ? r : t.custom, n, o);
        }
        return e;
      }
      function B(t, e, r) {
        let i = t.getProps();
        return M(i, e, void 0 !== r ? r : i.custom, t);
      }
      let D = [
          'animate',
          'whileInView',
          'whileFocus',
          'whileHover',
          'whileTap',
          'whileDrag',
          'exit',
        ],
        L = ['initial', ...D];
      function O(t) {
        let e;
        return () => (void 0 === e && (e = t()), e);
      }
      let V = O(() => void 0 !== window.ScrollTimeline);
      class I {
        constructor(t) {
          (this.stop = () => this.runAll('stop')), (this.animations = t.filter(Boolean));
        }
        get finished() {
          return Promise.all(this.animations.map((t) => ('finished' in t ? t.finished : t)));
        }
        getAll(t) {
          return this.animations[0][t];
        }
        setAll(t, e) {
          for (let r = 0; r < this.animations.length; r++) this.animations[r][t] = e;
        }
        attachTimeline(t, e) {
          let r = this.animations.map((r) =>
            V() && r.attachTimeline ? r.attachTimeline(t) : 'function' == typeof e ? e(r) : void 0
          );
          return () => {
            r.forEach((t, e) => {
              t && t(), this.animations[e].stop();
            });
          };
        }
        get time() {
          return this.getAll('time');
        }
        set time(t) {
          this.setAll('time', t);
        }
        get speed() {
          return this.getAll('speed');
        }
        set speed(t) {
          this.setAll('speed', t);
        }
        get startTime() {
          return this.getAll('startTime');
        }
        get duration() {
          let t = 0;
          for (let e = 0; e < this.animations.length; e++)
            t = Math.max(t, this.animations[e].duration);
          return t;
        }
        runAll(t) {
          this.animations.forEach((e) => e[t]());
        }
        flatten() {
          this.runAll('flatten');
        }
        play() {
          this.runAll('play');
        }
        pause() {
          this.runAll('pause');
        }
        cancel() {
          this.runAll('cancel');
        }
        complete() {
          this.runAll('complete');
        }
      }
      class $ extends I {
        then(t, e) {
          return Promise.all(this.animations).then(t).catch(e);
        }
      }
      function F(t, e) {
        return t ? t[e] || t.default || t : void 0;
      }
      function z(t) {
        let e = 0,
          r = t.next(e);
        for (; !r.done && e < 2e4; ) (e += 50), (r = t.next(e));
        return e >= 2e4 ? 1 / 0 : e;
      }
      function W(t) {
        return 'function' == typeof t;
      }
      function N(t, e) {
        (t.timeline = e), (t.onfinish = null);
      }
      let U = (t) => Array.isArray(t) && 'number' == typeof t[0],
        H = { linearEasing: void 0 },
        Y = (function (t, e) {
          let r = O(t);
          return () => {
            var t;
            return null !== (t = H[e]) && void 0 !== t ? t : r();
          };
        })(() => {
          try {
            document.createElement('div').animate({ opacity: 0 }, { easing: 'linear(0, 1)' });
          } catch (t) {
            return !1;
          }
          return !0;
        }, 'linearEasing'),
        X = (t, e, r) => {
          let i = e - t;
          return 0 === i ? 1 : (r - t) / i;
        },
        G = (t, e, r = 10) => {
          let i = '',
            n = Math.max(Math.round(e / r), 2);
          for (let e = 0; e < n; e++) i += t(X(0, n - 1, e)) + ', ';
          return `linear(${i.substring(0, i.length - 2)})`;
        },
        q = ([t, e, r, i]) => `cubic-bezier(${t}, ${e}, ${r}, ${i})`,
        K = {
          linear: 'linear',
          ease: 'ease',
          easeIn: 'ease-in',
          easeOut: 'ease-out',
          easeInOut: 'ease-in-out',
          circIn: q([0, 0.65, 0.55, 1]),
          circOut: q([0.55, 0, 1, 0.45]),
          backIn: q([0.31, 0.01, 0.66, -0.59]),
          backOut: q([0.33, 1.53, 0.69, 0.99]),
        },
        Z = { x: !1, y: !1 };
      function J(t, e) {
        let r = (function (t, e, r) {
            if (t instanceof Element) return [t];
            if ('string' == typeof t) {
              let e = document.querySelectorAll(t);
              return e ? Array.from(e) : [];
            }
            return Array.from(t);
          })(t),
          i = new AbortController();
        return [r, { passive: !0, ...e, signal: i.signal }, () => i.abort()];
      }
      function Q(t) {
        return (e) => {
          'touch' === e.pointerType || Z.x || Z.y || t(e);
        };
      }
      let tt = (t, e) => !!e && (t === e || tt(t, e.parentElement)),
        te = (t) =>
          'mouse' === t.pointerType
            ? 'number' != typeof t.button || t.button <= 0
            : !1 !== t.isPrimary,
        tr = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A']),
        ti = new WeakSet();
      function tn(t) {
        return (e) => {
          'Enter' === e.key && t(e);
        };
      }
      function to(t, e) {
        t.dispatchEvent(new PointerEvent('pointer' + e, { isPrimary: !0, bubbles: !0 }));
      }
      let ta = (t, e) => {
        let r = t.currentTarget;
        if (!r) return;
        let i = tn(() => {
          if (ti.has(r)) return;
          to(r, 'down');
          let t = tn(() => {
            to(r, 'up');
          });
          r.addEventListener('keyup', t, e), r.addEventListener('blur', () => to(r, 'cancel'), e);
        });
        r.addEventListener('keydown', i, e),
          r.addEventListener('blur', () => r.removeEventListener('keydown', i), e);
      };
      function ts(t) {
        return te(t) && !(Z.x || Z.y);
      }
      let tl = (t) => 1e3 * t,
        tu = (t) => t / 1e3,
        tc = (t) => t,
        td = [
          'transformPerspective',
          'x',
          'y',
          'z',
          'translateX',
          'translateY',
          'translateZ',
          'scale',
          'scaleX',
          'scaleY',
          'rotate',
          'rotateX',
          'rotateY',
          'rotateZ',
          'skew',
          'skewX',
          'skewY',
        ],
        th = new Set(td),
        tp = new Set(['width', 'height', 'top', 'left', 'right', 'bottom', ...td]),
        tf = (t) => !!(t && 'object' == typeof t && t.mix && t.toValue),
        tm = (t) => (E(t) ? t[t.length - 1] || 0 : t),
        tg = { skipAnimations: !1, useManualTiming: !1 },
        tv = ['read', 'resolveKeyframes', 'update', 'preRender', 'render', 'postRender'];
      function ty(t, e) {
        let r = !1,
          i = !0,
          n = { delta: 0, timestamp: 0, isProcessing: !1 },
          o = () => (r = !0),
          a = tv.reduce(
            (t, e) => (
              (t[e] = (function (t) {
                let e = new Set(),
                  r = new Set(),
                  i = !1,
                  n = !1,
                  o = new WeakSet(),
                  a = { delta: 0, timestamp: 0, isProcessing: !1 };
                function s(e) {
                  o.has(e) && (l.schedule(e), t()), e(a);
                }
                let l = {
                  schedule: (t, n = !1, a = !1) => {
                    let s = a && i ? e : r;
                    return n && o.add(t), s.has(t) || s.add(t), t;
                  },
                  cancel: (t) => {
                    r.delete(t), o.delete(t);
                  },
                  process: (t) => {
                    if (((a = t), i)) {
                      n = !0;
                      return;
                    }
                    (i = !0),
                      ([e, r] = [r, e]),
                      e.forEach(s),
                      e.clear(),
                      (i = !1),
                      n && ((n = !1), l.process(t));
                  },
                };
                return l;
              })(o)),
              t
            ),
            {}
          ),
          { read: s, resolveKeyframes: l, update: u, preRender: c, render: d, postRender: h } = a,
          p = () => {
            let o = tg.useManualTiming ? n.timestamp : performance.now();
            (r = !1),
              (n.delta = i ? 1e3 / 60 : Math.max(Math.min(o - n.timestamp, 40), 1)),
              (n.timestamp = o),
              (n.isProcessing = !0),
              s.process(n),
              l.process(n),
              u.process(n),
              c.process(n),
              d.process(n),
              h.process(n),
              (n.isProcessing = !1),
              r && e && ((i = !1), t(p));
          },
          f = () => {
            (r = !0), (i = !0), n.isProcessing || t(p);
          };
        return {
          schedule: tv.reduce((t, e) => {
            let i = a[e];
            return (t[e] = (t, e = !1, n = !1) => (r || f(), i.schedule(t, e, n))), t;
          }, {}),
          cancel: (t) => {
            for (let e = 0; e < tv.length; e++) a[tv[e]].cancel(t);
          },
          state: n,
          steps: a,
        };
      }
      let {
        schedule: tb,
        cancel: tx,
        state: tS,
        steps: tk,
      } = ty('undefined' != typeof requestAnimationFrame ? requestAnimationFrame : tc, !0);
      function tw() {
        i = void 0;
      }
      let tT = {
        now: () => (
          void 0 === i &&
            tT.set(tS.isProcessing || tg.useManualTiming ? tS.timestamp : performance.now()),
          i
        ),
        set: (t) => {
          (i = t), queueMicrotask(tw);
        },
      };
      function tP(t, e) {
        -1 === t.indexOf(e) && t.push(e);
      }
      function tA(t, e) {
        let r = t.indexOf(e);
        r > -1 && t.splice(r, 1);
      }
      class tC {
        constructor() {
          this.subscriptions = [];
        }
        add(t) {
          return tP(this.subscriptions, t), () => tA(this.subscriptions, t);
        }
        notify(t, e, r) {
          let i = this.subscriptions.length;
          if (i) {
            if (1 === i) this.subscriptions[0](t, e, r);
            else
              for (let n = 0; n < i; n++) {
                let i = this.subscriptions[n];
                i && i(t, e, r);
              }
          }
        }
        getSize() {
          return this.subscriptions.length;
        }
        clear() {
          this.subscriptions.length = 0;
        }
      }
      let tE = (t) => !isNaN(parseFloat(t)),
        tR = { current: void 0 };
      class tj {
        constructor(t, e = {}) {
          (this.version = '11.18.2'),
            (this.canTrackVelocity = null),
            (this.events = {}),
            (this.updateAndNotify = (t, e = !0) => {
              let r = tT.now();
              this.updatedAt !== r && this.setPrevFrameValue(),
                (this.prev = this.current),
                this.setCurrent(t),
                this.current !== this.prev &&
                  this.events.change &&
                  this.events.change.notify(this.current),
                e && this.events.renderRequest && this.events.renderRequest.notify(this.current);
            }),
            (this.hasAnimated = !1),
            this.setCurrent(t),
            (this.owner = e.owner);
        }
        setCurrent(t) {
          (this.current = t),
            (this.updatedAt = tT.now()),
            null === this.canTrackVelocity &&
              void 0 !== t &&
              (this.canTrackVelocity = tE(this.current));
        }
        setPrevFrameValue(t = this.current) {
          (this.prevFrameValue = t), (this.prevUpdatedAt = this.updatedAt);
        }
        onChange(t) {
          return this.on('change', t);
        }
        on(t, e) {
          this.events[t] || (this.events[t] = new tC());
          let r = this.events[t].add(e);
          return 'change' === t
            ? () => {
                r(),
                  tb.read(() => {
                    this.events.change.getSize() || this.stop();
                  });
              }
            : r;
        }
        clearListeners() {
          for (let t in this.events) this.events[t].clear();
        }
        attach(t, e) {
          (this.passiveEffect = t), (this.stopPassiveEffect = e);
        }
        set(t, e = !0) {
          e && this.passiveEffect
            ? this.passiveEffect(t, this.updateAndNotify)
            : this.updateAndNotify(t, e);
        }
        setWithVelocity(t, e, r) {
          this.set(e),
            (this.prev = void 0),
            (this.prevFrameValue = t),
            (this.prevUpdatedAt = this.updatedAt - r);
        }
        jump(t, e = !0) {
          this.updateAndNotify(t),
            (this.prev = t),
            (this.prevUpdatedAt = this.prevFrameValue = void 0),
            e && this.stop(),
            this.stopPassiveEffect && this.stopPassiveEffect();
        }
        get() {
          return tR.current && tR.current.push(this), this.current;
        }
        getPrevious() {
          return this.prev;
        }
        getVelocity() {
          var t;
          let e = tT.now();
          if (!this.canTrackVelocity || void 0 === this.prevFrameValue || e - this.updatedAt > 30)
            return 0;
          let r = Math.min(this.updatedAt - this.prevUpdatedAt, 30);
          return (
            (t = parseFloat(this.current) - parseFloat(this.prevFrameValue)), r ? (1e3 / r) * t : 0
          );
        }
        start(t) {
          return (
            this.stop(),
            new Promise((e) => {
              (this.hasAnimated = !0),
                (this.animation = t(e)),
                this.events.animationStart && this.events.animationStart.notify();
            }).then(() => {
              this.events.animationComplete && this.events.animationComplete.notify(),
                this.clearAnimation();
            })
          );
        }
        stop() {
          this.animation &&
            (this.animation.stop(),
            this.events.animationCancel && this.events.animationCancel.notify()),
            this.clearAnimation();
        }
        isAnimating() {
          return !!this.animation;
        }
        clearAnimation() {
          delete this.animation;
        }
        destroy() {
          this.clearListeners(), this.stop(), this.stopPassiveEffect && this.stopPassiveEffect();
        }
      }
      function t_(t, e) {
        return new tj(t, e);
      }
      let tM = (t) => !!(t && t.getVelocity);
      function tB(t, e) {
        let r = t.getValue('willChange');
        if (tM(r) && r.add) return r.add(e);
      }
      let tD = (t) => t.replace(/([a-z])([A-Z])/gu, '$1-$2').toLowerCase(),
        tL = 'data-' + tD('framerAppearId'),
        tO = { current: !1 },
        tV = (t, e, r) => (((1 - 3 * r + 3 * e) * t + (3 * r - 6 * e)) * t + 3 * e) * t;
      function tI(t, e, r, i) {
        if (t === e && r === i) return tc;
        let n = (e) =>
          (function (t, e, r, i, n) {
            let o, a;
            let s = 0;
            do (o = tV((a = e + (r - e) / 2), i, n) - t) > 0 ? (r = a) : (e = a);
            while (Math.abs(o) > 1e-7 && ++s < 12);
            return a;
          })(e, 0, 1, t, r);
        return (t) => (0 === t || 1 === t ? t : tV(n(t), e, i));
      }
      let t$ = (t) => (e) => (e <= 0.5 ? t(2 * e) / 2 : (2 - t(2 * (1 - e))) / 2),
        tF = (t) => (e) => 1 - t(1 - e),
        tz = tI(0.33, 1.53, 0.69, 0.99),
        tW = tF(tz),
        tN = t$(tW),
        tU = (t) => ((t *= 2) < 1 ? 0.5 * tW(t) : 0.5 * (2 - Math.pow(2, -10 * (t - 1)))),
        tH = (t) => 1 - Math.sin(Math.acos(t)),
        tY = tF(tH),
        tX = t$(tH),
        tG = (t) => /^0[^.\s]+$/u.test(t),
        tq = (t, e, r) => (r > e ? e : r < t ? t : r),
        tK = { test: (t) => 'number' == typeof t, parse: parseFloat, transform: (t) => t },
        tZ = { ...tK, transform: (t) => tq(0, 1, t) },
        tJ = { ...tK, default: 1 },
        tQ = (t) => Math.round(1e5 * t) / 1e5,
        t0 = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu,
        t1 =
          /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu,
        t5 = (t, e) => (r) =>
          !!(
            ('string' == typeof r && t1.test(r) && r.startsWith(t)) ||
            (e && null != r && Object.prototype.hasOwnProperty.call(r, e))
          ),
        t2 = (t, e, r) => (i) => {
          if ('string' != typeof i) return i;
          let [n, o, a, s] = i.match(t0);
          return {
            [t]: parseFloat(n),
            [e]: parseFloat(o),
            [r]: parseFloat(a),
            alpha: void 0 !== s ? parseFloat(s) : 1,
          };
        },
        t3 = (t) => tq(0, 255, t),
        t4 = { ...tK, transform: (t) => Math.round(t3(t)) },
        t9 = {
          test: t5('rgb', 'red'),
          parse: t2('red', 'green', 'blue'),
          transform: ({ red: t, green: e, blue: r, alpha: i = 1 }) =>
            'rgba(' +
            t4.transform(t) +
            ', ' +
            t4.transform(e) +
            ', ' +
            t4.transform(r) +
            ', ' +
            tQ(tZ.transform(i)) +
            ')',
        },
        t6 = {
          test: t5('#'),
          parse: function (t) {
            let e = '',
              r = '',
              i = '',
              n = '';
            return (
              t.length > 5
                ? ((e = t.substring(1, 3)),
                  (r = t.substring(3, 5)),
                  (i = t.substring(5, 7)),
                  (n = t.substring(7, 9)))
                : ((e = t.substring(1, 2)),
                  (r = t.substring(2, 3)),
                  (i = t.substring(3, 4)),
                  (n = t.substring(4, 5)),
                  (e += e),
                  (r += r),
                  (i += i),
                  (n += n)),
              {
                red: parseInt(e, 16),
                green: parseInt(r, 16),
                blue: parseInt(i, 16),
                alpha: n ? parseInt(n, 16) / 255 : 1,
              }
            );
          },
          transform: t9.transform,
        },
        t8 = (t) => ({
          test: (e) => 'string' == typeof e && e.endsWith(t) && 1 === e.split(' ').length,
          parse: parseFloat,
          transform: (e) => `${e}${t}`,
        }),
        t7 = t8('deg'),
        et = t8('%'),
        ee = t8('px'),
        er = t8('vh'),
        ei = t8('vw'),
        en = { ...et, parse: (t) => et.parse(t) / 100, transform: (t) => et.transform(100 * t) },
        eo = {
          test: t5('hsl', 'hue'),
          parse: t2('hue', 'saturation', 'lightness'),
          transform: ({ hue: t, saturation: e, lightness: r, alpha: i = 1 }) =>
            'hsla(' +
            Math.round(t) +
            ', ' +
            et.transform(tQ(e)) +
            ', ' +
            et.transform(tQ(r)) +
            ', ' +
            tQ(tZ.transform(i)) +
            ')',
        },
        ea = {
          test: (t) => t9.test(t) || t6.test(t) || eo.test(t),
          parse: (t) => (t9.test(t) ? t9.parse(t) : eo.test(t) ? eo.parse(t) : t6.parse(t)),
          transform: (t) =>
            'string' == typeof t ? t : t.hasOwnProperty('red') ? t9.transform(t) : eo.transform(t),
        },
        es =
          /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu,
        el = 'number',
        eu = 'color',
        ec =
          /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
      function ed(t) {
        let e = t.toString(),
          r = [],
          i = { color: [], number: [], var: [] },
          n = [],
          o = 0,
          a = e
            .replace(
              ec,
              (t) => (
                ea.test(t)
                  ? (i.color.push(o), n.push(eu), r.push(ea.parse(t)))
                  : t.startsWith('var(')
                    ? (i.var.push(o), n.push('var'), r.push(t))
                    : (i.number.push(o), n.push(el), r.push(parseFloat(t))),
                ++o,
                '${}'
              )
            )
            .split('${}');
        return { values: r, split: a, indexes: i, types: n };
      }
      function eh(t) {
        return ed(t).values;
      }
      function ep(t) {
        let { split: e, types: r } = ed(t),
          i = e.length;
        return (t) => {
          let n = '';
          for (let o = 0; o < i; o++)
            if (((n += e[o]), void 0 !== t[o])) {
              let e = r[o];
              e === el ? (n += tQ(t[o])) : e === eu ? (n += ea.transform(t[o])) : (n += t[o]);
            }
          return n;
        };
      }
      let ef = (t) => ('number' == typeof t ? 0 : t),
        em = {
          test: function (t) {
            var e, r;
            return (
              isNaN(t) &&
              'string' == typeof t &&
              ((null === (e = t.match(t0)) || void 0 === e ? void 0 : e.length) || 0) +
                ((null === (r = t.match(es)) || void 0 === r ? void 0 : r.length) || 0) >
                0
            );
          },
          parse: eh,
          createTransformer: ep,
          getAnimatableNone: function (t) {
            let e = eh(t);
            return ep(t)(e.map(ef));
          },
        },
        eg = new Set(['brightness', 'contrast', 'saturate', 'opacity']);
      function ev(t) {
        let [e, r] = t.slice(0, -1).split('(');
        if ('drop-shadow' === e) return t;
        let [i] = r.match(t0) || [];
        if (!i) return t;
        let n = r.replace(i, ''),
          o = eg.has(e) ? 1 : 0;
        return i !== r && (o *= 100), e + '(' + o + n + ')';
      }
      let ey = /\b([a-z-]*)\(.*?\)/gu,
        eb = {
          ...em,
          getAnimatableNone: (t) => {
            let e = t.match(ey);
            return e ? e.map(ev).join(' ') : t;
          },
        },
        ex = { ...tK, transform: Math.round },
        eS = {
          borderWidth: ee,
          borderTopWidth: ee,
          borderRightWidth: ee,
          borderBottomWidth: ee,
          borderLeftWidth: ee,
          borderRadius: ee,
          radius: ee,
          borderTopLeftRadius: ee,
          borderTopRightRadius: ee,
          borderBottomRightRadius: ee,
          borderBottomLeftRadius: ee,
          width: ee,
          maxWidth: ee,
          height: ee,
          maxHeight: ee,
          top: ee,
          right: ee,
          bottom: ee,
          left: ee,
          padding: ee,
          paddingTop: ee,
          paddingRight: ee,
          paddingBottom: ee,
          paddingLeft: ee,
          margin: ee,
          marginTop: ee,
          marginRight: ee,
          marginBottom: ee,
          marginLeft: ee,
          backgroundPositionX: ee,
          backgroundPositionY: ee,
          rotate: t7,
          rotateX: t7,
          rotateY: t7,
          rotateZ: t7,
          scale: tJ,
          scaleX: tJ,
          scaleY: tJ,
          scaleZ: tJ,
          skew: t7,
          skewX: t7,
          skewY: t7,
          distance: ee,
          translateX: ee,
          translateY: ee,
          translateZ: ee,
          x: ee,
          y: ee,
          z: ee,
          perspective: ee,
          transformPerspective: ee,
          opacity: tZ,
          originX: en,
          originY: en,
          originZ: ee,
          zIndex: ex,
          size: ee,
          fillOpacity: tZ,
          strokeOpacity: tZ,
          numOctaves: ex,
        },
        ek = {
          ...eS,
          color: ea,
          backgroundColor: ea,
          outlineColor: ea,
          fill: ea,
          stroke: ea,
          borderColor: ea,
          borderTopColor: ea,
          borderRightColor: ea,
          borderBottomColor: ea,
          borderLeftColor: ea,
          filter: eb,
          WebkitFilter: eb,
        },
        ew = (t) => ek[t];
      function eT(t, e) {
        let r = ew(t);
        return r !== eb && (r = em), r.getAnimatableNone ? r.getAnimatableNone(e) : void 0;
      }
      let eP = new Set(['auto', 'none', '0']),
        eA = (t) => t === tK || t === ee,
        eC = (t, e) => parseFloat(t.split(', ')[e]),
        eE =
          (t, e) =>
          (r, { transform: i }) => {
            if ('none' === i || !i) return 0;
            let n = i.match(/^matrix3d\((.+)\)$/u);
            if (n) return eC(n[1], e);
            {
              let e = i.match(/^matrix\((.+)\)$/u);
              return e ? eC(e[1], t) : 0;
            }
          },
        eR = new Set(['x', 'y', 'z']),
        ej = td.filter((t) => !eR.has(t)),
        e_ = {
          width: ({ x: t }, { paddingLeft: e = '0', paddingRight: r = '0' }) =>
            t.max - t.min - parseFloat(e) - parseFloat(r),
          height: ({ y: t }, { paddingTop: e = '0', paddingBottom: r = '0' }) =>
            t.max - t.min - parseFloat(e) - parseFloat(r),
          top: (t, { top: e }) => parseFloat(e),
          left: (t, { left: e }) => parseFloat(e),
          bottom: ({ y: t }, { top: e }) => parseFloat(e) + (t.max - t.min),
          right: ({ x: t }, { left: e }) => parseFloat(e) + (t.max - t.min),
          x: eE(4, 13),
          y: eE(5, 14),
        };
      (e_.translateX = e_.x), (e_.translateY = e_.y);
      let eM = new Set(),
        eB = !1,
        eD = !1;
      function eL() {
        if (eD) {
          let t = Array.from(eM).filter((t) => t.needsMeasurement),
            e = new Set(t.map((t) => t.element)),
            r = new Map();
          e.forEach((t) => {
            let e = (function (t) {
              let e = [];
              return (
                ej.forEach((r) => {
                  let i = t.getValue(r);
                  void 0 !== i && (e.push([r, i.get()]), i.set(r.startsWith('scale') ? 1 : 0));
                }),
                e
              );
            })(t);
            e.length && (r.set(t, e), t.render());
          }),
            t.forEach((t) => t.measureInitialState()),
            e.forEach((t) => {
              t.render();
              let e = r.get(t);
              e &&
                e.forEach(([e, r]) => {
                  var i;
                  null === (i = t.getValue(e)) || void 0 === i || i.set(r);
                });
            }),
            t.forEach((t) => t.measureEndState()),
            t.forEach((t) => {
              void 0 !== t.suspendedScrollY && window.scrollTo(0, t.suspendedScrollY);
            });
        }
        (eD = !1), (eB = !1), eM.forEach((t) => t.complete()), eM.clear();
      }
      function eO() {
        eM.forEach((t) => {
          t.readKeyframes(), t.needsMeasurement && (eD = !0);
        });
      }
      class eV {
        constructor(t, e, r, i, n, o = !1) {
          (this.isComplete = !1),
            (this.isAsync = !1),
            (this.needsMeasurement = !1),
            (this.isScheduled = !1),
            (this.unresolvedKeyframes = [...t]),
            (this.onComplete = e),
            (this.name = r),
            (this.motionValue = i),
            (this.element = n),
            (this.isAsync = o);
        }
        scheduleResolve() {
          (this.isScheduled = !0),
            this.isAsync
              ? (eM.add(this), eB || ((eB = !0), tb.read(eO), tb.resolveKeyframes(eL)))
              : (this.readKeyframes(), this.complete());
        }
        readKeyframes() {
          let { unresolvedKeyframes: t, name: e, element: r, motionValue: i } = this;
          for (let n = 0; n < t.length; n++)
            if (null === t[n]) {
              if (0 === n) {
                let n = null == i ? void 0 : i.get(),
                  o = t[t.length - 1];
                if (void 0 !== n) t[0] = n;
                else if (r && e) {
                  let i = r.readValue(e, o);
                  null != i && (t[0] = i);
                }
                void 0 === t[0] && (t[0] = o), i && void 0 === n && i.set(t[0]);
              } else t[n] = t[n - 1];
            }
        }
        setFinalKeyframe() {}
        measureInitialState() {}
        renderEndStyles() {}
        measureEndState() {}
        complete() {
          (this.isComplete = !0),
            this.onComplete(this.unresolvedKeyframes, this.finalKeyframe),
            eM.delete(this);
        }
        cancel() {
          this.isComplete || ((this.isScheduled = !1), eM.delete(this));
        }
        resume() {
          this.isComplete || this.scheduleResolve();
        }
      }
      let eI = (t) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(t),
        e$ = (t) => (e) => 'string' == typeof e && e.startsWith(t),
        eF = e$('--'),
        ez = e$('var(--'),
        eW = (t) => !!ez(t) && eN.test(t.split('/*')[0].trim()),
        eN = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu,
        eU = /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u,
        eH = (t) => (e) => e.test(t),
        eY = [tK, ee, et, t7, ei, er, { test: (t) => 'auto' === t, parse: (t) => t }],
        eX = (t) => eY.find(eH(t));
      class eG extends eV {
        constructor(t, e, r, i, n) {
          super(t, e, r, i, n, !0);
        }
        readKeyframes() {
          let { unresolvedKeyframes: t, element: e, name: r } = this;
          if (!e || !e.current) return;
          super.readKeyframes();
          for (let r = 0; r < t.length; r++) {
            let i = t[r];
            if ('string' == typeof i && eW((i = i.trim()))) {
              let n = (function t(e, r, i = 1) {
                tc(
                  i <= 4,
                  `Max CSS variable fallback depth detected in property "${e}". This may indicate a circular fallback dependency.`
                );
                let [n, o] = (function (t) {
                  let e = eU.exec(t);
                  if (!e) return [,];
                  let [, r, i, n] = e;
                  return [`--${null != r ? r : i}`, n];
                })(e);
                if (!n) return;
                let a = window.getComputedStyle(r).getPropertyValue(n);
                if (a) {
                  let t = a.trim();
                  return eI(t) ? parseFloat(t) : t;
                }
                return eW(o) ? t(o, r, i + 1) : o;
              })(i, e.current);
              void 0 !== n && (t[r] = n), r === t.length - 1 && (this.finalKeyframe = i);
            }
          }
          if ((this.resolveNoneKeyframes(), !tp.has(r) || 2 !== t.length)) return;
          let [i, n] = t,
            o = eX(i),
            a = eX(n);
          if (o !== a) {
            if (eA(o) && eA(a))
              for (let e = 0; e < t.length; e++) {
                let r = t[e];
                'string' == typeof r && (t[e] = parseFloat(r));
              }
            else this.needsMeasurement = !0;
          }
        }
        resolveNoneKeyframes() {
          let { unresolvedKeyframes: t, name: e } = this,
            r = [];
          for (let e = 0; e < t.length; e++) {
            var i;
            ('number' == typeof (i = t[e])
              ? 0 === i
              : null === i || 'none' === i || '0' === i || tG(i)) && r.push(e);
          }
          r.length &&
            (function (t, e, r) {
              let i,
                n = 0;
              for (; n < t.length && !i; ) {
                let e = t[n];
                'string' == typeof e && !eP.has(e) && ed(e).values.length && (i = t[n]), n++;
              }
              if (i && r) for (let n of e) t[n] = eT(r, i);
            })(t, r, e);
        }
        measureInitialState() {
          let { element: t, unresolvedKeyframes: e, name: r } = this;
          if (!t || !t.current) return;
          'height' === r && (this.suspendedScrollY = window.pageYOffset),
            (this.measuredOrigin = e_[r](
              t.measureViewportBox(),
              window.getComputedStyle(t.current)
            )),
            (e[0] = this.measuredOrigin);
          let i = e[e.length - 1];
          void 0 !== i && t.getValue(r, i).jump(i, !1);
        }
        measureEndState() {
          var t;
          let { element: e, name: r, unresolvedKeyframes: i } = this;
          if (!e || !e.current) return;
          let n = e.getValue(r);
          n && n.jump(this.measuredOrigin, !1);
          let o = i.length - 1,
            a = i[o];
          (i[o] = e_[r](e.measureViewportBox(), window.getComputedStyle(e.current))),
            null !== a && void 0 === this.finalKeyframe && (this.finalKeyframe = a),
            (null === (t = this.removedTransforms) || void 0 === t ? void 0 : t.length) &&
              this.removedTransforms.forEach(([t, r]) => {
                e.getValue(t).set(r);
              }),
            this.resolveNoneKeyframes();
        }
      }
      let eq = (t, e) =>
          'zIndex' !== e &&
          !!(
            'number' == typeof t ||
            Array.isArray(t) ||
            ('string' == typeof t && (em.test(t) || '0' === t) && !t.startsWith('url('))
          ),
        eK = (t) => null !== t;
      function eZ(t, { repeat: e, repeatType: r = 'loop' }, i) {
        let n = t.filter(eK),
          o = e && 'loop' !== r && e % 2 == 1 ? 0 : n.length - 1;
        return o && void 0 !== i ? i : n[o];
      }
      class eJ {
        constructor({
          autoplay: t = !0,
          delay: e = 0,
          type: r = 'keyframes',
          repeat: i = 0,
          repeatDelay: n = 0,
          repeatType: o = 'loop',
          ...a
        }) {
          (this.isStopped = !1),
            (this.hasAttemptedResolve = !1),
            (this.createdAt = tT.now()),
            (this.options = {
              autoplay: t,
              delay: e,
              type: r,
              repeat: i,
              repeatDelay: n,
              repeatType: o,
              ...a,
            }),
            this.updateFinishedPromise();
        }
        calcStartTime() {
          return this.resolvedAt && this.resolvedAt - this.createdAt > 40
            ? this.resolvedAt
            : this.createdAt;
        }
        get resolved() {
          return this._resolved || this.hasAttemptedResolve || (eO(), eL()), this._resolved;
        }
        onKeyframesResolved(t, e) {
          (this.resolvedAt = tT.now()), (this.hasAttemptedResolve = !0);
          let {
            name: r,
            type: i,
            velocity: n,
            delay: o,
            onComplete: a,
            onUpdate: s,
            isGenerator: l,
          } = this.options;
          if (
            !l &&
            !(function (t, e, r, i) {
              let n = t[0];
              if (null === n) return !1;
              if ('display' === e || 'visibility' === e) return !0;
              let o = t[t.length - 1],
                a = eq(n, e),
                s = eq(o, e);
              return (
                tc(
                  a === s,
                  `You are trying to animate ${e} from "${n}" to "${o}". ${n} is not an animatable value - to enable this animation set ${n} to a value animatable to ${o} via the \`style\` property.`
                ),
                !!a &&
                  !!s &&
                  ((function (t) {
                    let e = t[0];
                    if (1 === t.length) return !0;
                    for (let r = 0; r < t.length; r++) if (t[r] !== e) return !0;
                  })(t) ||
                    (('spring' === r || W(r)) && i))
              );
            })(t, r, i, n)
          ) {
            if (tO.current || !o) {
              s && s(eZ(t, this.options, e)), a && a(), this.resolveFinishedPromise();
              return;
            }
            this.options.duration = 0;
          }
          let u = this.initPlayback(t, e);
          !1 !== u &&
            ((this._resolved = { keyframes: t, finalKeyframe: e, ...u }), this.onPostResolved());
        }
        onPostResolved() {}
        then(t, e) {
          return this.currentFinishedPromise.then(t, e);
        }
        flatten() {
          (this.options.type = 'keyframes'), (this.options.ease = 'linear');
        }
        updateFinishedPromise() {
          this.currentFinishedPromise = new Promise((t) => {
            this.resolveFinishedPromise = t;
          });
        }
      }
      let eQ = (t, e, r) => t + (e - t) * r;
      function e0(t, e, r) {
        return (r < 0 && (r += 1), r > 1 && (r -= 1), r < 1 / 6)
          ? t + (e - t) * 6 * r
          : r < 0.5
            ? e
            : r < 2 / 3
              ? t + (e - t) * (2 / 3 - r) * 6
              : t;
      }
      function e1(t, e) {
        return (r) => (r > 0 ? e : t);
      }
      let e5 = (t, e, r) => {
          let i = t * t,
            n = r * (e * e - i) + i;
          return n < 0 ? 0 : Math.sqrt(n);
        },
        e2 = [t6, t9, eo],
        e3 = (t) => e2.find((e) => e.test(t));
      function e4(t) {
        let e = e3(t);
        if (
          (tc(!!e, `'${t}' is not an animatable color. Use the equivalent color code instead.`), !e)
        )
          return !1;
        let r = e.parse(t);
        return (
          e === eo &&
            (r = (function ({ hue: t, saturation: e, lightness: r, alpha: i }) {
              (t /= 360), (r /= 100);
              let n = 0,
                o = 0,
                a = 0;
              if ((e /= 100)) {
                let i = r < 0.5 ? r * (1 + e) : r + e - r * e,
                  s = 2 * r - i;
                (n = e0(s, i, t + 1 / 3)), (o = e0(s, i, t)), (a = e0(s, i, t - 1 / 3));
              } else n = o = a = r;
              return {
                red: Math.round(255 * n),
                green: Math.round(255 * o),
                blue: Math.round(255 * a),
                alpha: i,
              };
            })(r)),
          r
        );
      }
      let e9 = (t, e) => {
          let r = e4(t),
            i = e4(e);
          if (!r || !i) return e1(t, e);
          let n = { ...r };
          return (t) => (
            (n.red = e5(r.red, i.red, t)),
            (n.green = e5(r.green, i.green, t)),
            (n.blue = e5(r.blue, i.blue, t)),
            (n.alpha = eQ(r.alpha, i.alpha, t)),
            t9.transform(n)
          );
        },
        e6 = (t, e) => (r) => e(t(r)),
        e8 = (...t) => t.reduce(e6),
        e7 = new Set(['none', 'hidden']);
      function rt(t, e) {
        return (r) => eQ(t, e, r);
      }
      function re(t) {
        return 'number' == typeof t
          ? rt
          : 'string' == typeof t
            ? eW(t)
              ? e1
              : ea.test(t)
                ? e9
                : rn
            : Array.isArray(t)
              ? rr
              : 'object' == typeof t
                ? ea.test(t)
                  ? e9
                  : ri
                : e1;
      }
      function rr(t, e) {
        let r = [...t],
          i = r.length,
          n = t.map((t, r) => re(t)(t, e[r]));
        return (t) => {
          for (let e = 0; e < i; e++) r[e] = n[e](t);
          return r;
        };
      }
      function ri(t, e) {
        let r = { ...t, ...e },
          i = {};
        for (let n in r) void 0 !== t[n] && void 0 !== e[n] && (i[n] = re(t[n])(t[n], e[n]));
        return (t) => {
          for (let e in i) r[e] = i[e](t);
          return r;
        };
      }
      let rn = (t, e) => {
        let r = em.createTransformer(e),
          i = ed(t),
          n = ed(e);
        return i.indexes.var.length === n.indexes.var.length &&
          i.indexes.color.length === n.indexes.color.length &&
          i.indexes.number.length >= n.indexes.number.length
          ? (e7.has(t) && !n.values.length) || (e7.has(e) && !i.values.length)
            ? e7.has(t)
              ? (r) => (r <= 0 ? t : e)
              : (r) => (r >= 1 ? e : t)
            : e8(
                rr(
                  (function (t, e) {
                    var r;
                    let i = [],
                      n = { color: 0, var: 0, number: 0 };
                    for (let o = 0; o < e.values.length; o++) {
                      let a = e.types[o],
                        s = t.indexes[a][n[a]],
                        l = null !== (r = t.values[s]) && void 0 !== r ? r : 0;
                      (i[o] = l), n[a]++;
                    }
                    return i;
                  })(i, n),
                  n.values
                ),
                r
              )
          : (tc(
              !0,
              `Complex values '${t}' and '${e}' too different to mix. Ensure all colors are of the same type, and that each contains the same quantity of number and color values. Falling back to instant transition.`
            ),
            e1(t, e));
      };
      function ro(t, e, r) {
        return 'number' == typeof t && 'number' == typeof e && 'number' == typeof r
          ? eQ(t, e, r)
          : re(t)(t, e);
      }
      function ra(t, e, r) {
        var i, n;
        let o = Math.max(e - 5, 0);
        return (i = r - t(o)), (n = e - o) ? (1e3 / n) * i : 0;
      }
      let rs = {
        stiffness: 100,
        damping: 10,
        mass: 1,
        velocity: 0,
        duration: 800,
        bounce: 0.3,
        visualDuration: 0.3,
        restSpeed: { granular: 0.01, default: 2 },
        restDelta: { granular: 0.005, default: 0.5 },
        minDuration: 0.01,
        maxDuration: 10,
        minDamping: 0.05,
        maxDamping: 1,
      };
      function rl(t, e) {
        return t * Math.sqrt(1 - e * e);
      }
      let ru = ['duration', 'bounce'],
        rc = ['stiffness', 'damping', 'mass'];
      function rd(t, e) {
        return e.some((e) => void 0 !== t[e]);
      }
      function rh(t = rs.visualDuration, e = rs.bounce) {
        let r;
        let i = 'object' != typeof t ? { visualDuration: t, keyframes: [0, 1], bounce: e } : t,
          { restSpeed: n, restDelta: o } = i,
          a = i.keyframes[0],
          s = i.keyframes[i.keyframes.length - 1],
          l = { done: !1, value: a },
          {
            stiffness: u,
            damping: c,
            mass: d,
            duration: h,
            velocity: p,
            isResolvedFromDuration: f,
          } = (function (t) {
            let e = {
              velocity: rs.velocity,
              stiffness: rs.stiffness,
              damping: rs.damping,
              mass: rs.mass,
              isResolvedFromDuration: !1,
              ...t,
            };
            if (!rd(t, rc) && rd(t, ru)) {
              if (t.visualDuration) {
                let r = (2 * Math.PI) / (1.2 * t.visualDuration),
                  i = r * r,
                  n = 2 * tq(0.05, 1, 1 - (t.bounce || 0)) * Math.sqrt(i);
                e = { ...e, mass: rs.mass, stiffness: i, damping: n };
              } else {
                let r = (function ({
                  duration: t = rs.duration,
                  bounce: e = rs.bounce,
                  velocity: r = rs.velocity,
                  mass: i = rs.mass,
                }) {
                  let n, o;
                  tc(t <= tl(rs.maxDuration), 'Spring duration must be 10 seconds or less');
                  let a = 1 - e;
                  (a = tq(rs.minDamping, rs.maxDamping, a)),
                    (t = tq(rs.minDuration, rs.maxDuration, tu(t))),
                    a < 1
                      ? ((n = (e) => {
                          let i = e * a,
                            n = i * t;
                          return 0.001 - ((i - r) / rl(e, a)) * Math.exp(-n);
                        }),
                        (o = (e) => {
                          let i = e * a * t,
                            o = Math.pow(a, 2) * Math.pow(e, 2) * t,
                            s = rl(Math.pow(e, 2), a);
                          return (
                            ((i * r + r - o) * Math.exp(-i) * (-n(e) + 0.001 > 0 ? -1 : 1)) / s
                          );
                        }))
                      : ((n = (e) => -0.001 + Math.exp(-e * t) * ((e - r) * t + 1)),
                        (o = (e) => t * t * (r - e) * Math.exp(-e * t)));
                  let s = (function (t, e, r) {
                    let i = r;
                    for (let r = 1; r < 12; r++) i -= t(i) / e(i);
                    return i;
                  })(n, o, 5 / t);
                  if (((t = tl(t)), isNaN(s)))
                    return { stiffness: rs.stiffness, damping: rs.damping, duration: t };
                  {
                    let e = Math.pow(s, 2) * i;
                    return { stiffness: e, damping: 2 * a * Math.sqrt(i * e), duration: t };
                  }
                })(t);
                (e = { ...e, ...r, mass: rs.mass }).isResolvedFromDuration = !0;
              }
            }
            return e;
          })({ ...i, velocity: -tu(i.velocity || 0) }),
          m = p || 0,
          g = c / (2 * Math.sqrt(u * d)),
          v = s - a,
          y = tu(Math.sqrt(u / d)),
          b = 5 > Math.abs(v);
        if (
          (n || (n = b ? rs.restSpeed.granular : rs.restSpeed.default),
          o || (o = b ? rs.restDelta.granular : rs.restDelta.default),
          g < 1)
        ) {
          let t = rl(y, g);
          r = (e) =>
            s -
            Math.exp(-g * y * e) * (((m + g * y * v) / t) * Math.sin(t * e) + v * Math.cos(t * e));
        } else if (1 === g) r = (t) => s - Math.exp(-y * t) * (v + (m + y * v) * t);
        else {
          let t = y * Math.sqrt(g * g - 1);
          r = (e) => {
            let r = Math.exp(-g * y * e),
              i = Math.min(t * e, 300);
            return s - (r * ((m + g * y * v) * Math.sinh(i) + t * v * Math.cosh(i))) / t;
          };
        }
        let x = {
          calculatedDuration: (f && h) || null,
          next: (t) => {
            let e = r(t);
            if (f) l.done = t >= h;
            else {
              let i = 0;
              g < 1 && (i = 0 === t ? tl(m) : ra(r, t, e));
              let a = Math.abs(i) <= n,
                u = Math.abs(s - e) <= o;
              l.done = a && u;
            }
            return (l.value = l.done ? s : e), l;
          },
          toString: () => {
            let t = Math.min(z(x), 2e4),
              e = G((e) => x.next(t * e).value, t, 30);
            return t + 'ms ' + e;
          },
        };
        return x;
      }
      function rp({
        keyframes: t,
        velocity: e = 0,
        power: r = 0.8,
        timeConstant: i = 325,
        bounceDamping: n = 10,
        bounceStiffness: o = 500,
        modifyTarget: a,
        min: s,
        max: l,
        restDelta: u = 0.5,
        restSpeed: c,
      }) {
        let d, h;
        let p = t[0],
          f = { done: !1, value: p },
          m = (t) => (void 0 !== s && t < s) || (void 0 !== l && t > l),
          g = (t) =>
            void 0 === s ? l : void 0 === l ? s : Math.abs(s - t) < Math.abs(l - t) ? s : l,
          v = r * e,
          y = p + v,
          b = void 0 === a ? y : a(y);
        b !== y && (v = b - p);
        let x = (t) => -v * Math.exp(-t / i),
          S = (t) => b + x(t),
          k = (t) => {
            let e = x(t),
              r = S(t);
            (f.done = Math.abs(e) <= u), (f.value = f.done ? b : r);
          },
          w = (t) => {
            m(f.value) &&
              ((d = t),
              (h = rh({
                keyframes: [f.value, g(f.value)],
                velocity: ra(S, t, f.value),
                damping: n,
                stiffness: o,
                restDelta: u,
                restSpeed: c,
              })));
          };
        return (
          w(0),
          {
            calculatedDuration: null,
            next: (t) => {
              let e = !1;
              return (h || void 0 !== d || ((e = !0), k(t), w(t)), void 0 !== d && t >= d)
                ? h.next(t - d)
                : (e || k(t), f);
            },
          }
        );
      }
      let rf = tI(0.42, 0, 1, 1),
        rm = tI(0, 0, 0.58, 1),
        rg = tI(0.42, 0, 0.58, 1),
        rv = (t) => Array.isArray(t) && 'number' != typeof t[0],
        ry = {
          linear: tc,
          easeIn: rf,
          easeInOut: rg,
          easeOut: rm,
          circIn: tH,
          circInOut: tX,
          circOut: tY,
          backIn: tW,
          backInOut: tN,
          backOut: tz,
          anticipate: tU,
        },
        rb = (t) => {
          if (U(t)) {
            tc(4 === t.length, 'Cubic bezier arrays must contain four numerical values.');
            let [e, r, i, n] = t;
            return tI(e, r, i, n);
          }
          return 'string' == typeof t
            ? (tc(void 0 !== ry[t], `Invalid easing type '${t}'`), ry[t])
            : t;
        };
      function rx({ duration: t = 300, keyframes: e, times: r, ease: i = 'easeInOut' }) {
        let n = rv(i) ? i.map(rb) : rb(i),
          o = { done: !1, value: e[0] },
          a = (function (t, e, { clamp: r = !0, ease: i, mixer: n } = {}) {
            let o = t.length;
            if (
              (tc(o === e.length, 'Both input and output ranges must be the same length'), 1 === o)
            )
              return () => e[0];
            if (2 === o && e[0] === e[1]) return () => e[1];
            let a = t[0] === t[1];
            t[0] > t[o - 1] && ((t = [...t].reverse()), (e = [...e].reverse()));
            let s = (function (t, e, r) {
                let i = [],
                  n = r || ro,
                  o = t.length - 1;
                for (let r = 0; r < o; r++) {
                  let o = n(t[r], t[r + 1]);
                  e && (o = e8(Array.isArray(e) ? e[r] || tc : e, o)), i.push(o);
                }
                return i;
              })(e, i, n),
              l = s.length,
              u = (r) => {
                if (a && r < t[0]) return e[0];
                let i = 0;
                if (l > 1) for (; i < t.length - 2 && !(r < t[i + 1]); i++);
                let n = X(t[i], t[i + 1], r);
                return s[i](n);
              };
            return r ? (e) => u(tq(t[0], t[o - 1], e)) : u;
          })(
            (r && r.length === e.length
              ? r
              : (function (t) {
                  let e = [0];
                  return (
                    (function (t, e) {
                      let r = t[t.length - 1];
                      for (let i = 1; i <= e; i++) {
                        let n = X(0, e, i);
                        t.push(eQ(r, 1, n));
                      }
                    })(e, t.length - 1),
                    e
                  );
                })(e)
            ).map((e) => e * t),
            e,
            { ease: Array.isArray(n) ? n : e.map(() => n || rg).splice(0, e.length - 1) }
          );
        return { calculatedDuration: t, next: (e) => ((o.value = a(e)), (o.done = e >= t), o) };
      }
      let rS = (t) => {
          let e = ({ timestamp: e }) => t(e);
          return {
            start: () => tb.update(e, !0),
            stop: () => tx(e),
            now: () => (tS.isProcessing ? tS.timestamp : tT.now()),
          };
        },
        rk = { decay: rp, inertia: rp, tween: rx, keyframes: rx, spring: rh },
        rw = (t) => t / 100;
      class rT extends eJ {
        constructor(t) {
          super(t),
            (this.holdTime = null),
            (this.cancelTime = null),
            (this.currentTime = 0),
            (this.playbackSpeed = 1),
            (this.pendingPlayState = 'running'),
            (this.startTime = null),
            (this.state = 'idle'),
            (this.stop = () => {
              if ((this.resolver.cancel(), (this.isStopped = !0), 'idle' === this.state)) return;
              this.teardown();
              let { onStop: t } = this.options;
              t && t();
            });
          let { name: e, motionValue: r, element: i, keyframes: n } = this.options,
            o = (null == i ? void 0 : i.KeyframeResolver) || eV;
          (this.resolver = new o(n, (t, e) => this.onKeyframesResolved(t, e), e, r, i)),
            this.resolver.scheduleResolve();
        }
        flatten() {
          super.flatten(),
            this._resolved &&
              Object.assign(this._resolved, this.initPlayback(this._resolved.keyframes));
        }
        initPlayback(t) {
          let e, r;
          let {
              type: i = 'keyframes',
              repeat: n = 0,
              repeatDelay: o = 0,
              repeatType: a,
              velocity: s = 0,
            } = this.options,
            l = W(i) ? i : rk[i] || rx;
          l !== rx && 'number' != typeof t[0] && ((e = e8(rw, ro(t[0], t[1]))), (t = [0, 100]));
          let u = l({ ...this.options, keyframes: t });
          'mirror' === a && (r = l({ ...this.options, keyframes: [...t].reverse(), velocity: -s })),
            null === u.calculatedDuration && (u.calculatedDuration = z(u));
          let { calculatedDuration: c } = u,
            d = c + o;
          return {
            generator: u,
            mirroredGenerator: r,
            mapPercentToKeyframes: e,
            calculatedDuration: c,
            resolvedDuration: d,
            totalDuration: d * (n + 1) - o,
          };
        }
        onPostResolved() {
          let { autoplay: t = !0 } = this.options;
          this.play(),
            'paused' !== this.pendingPlayState && t
              ? (this.state = this.pendingPlayState)
              : this.pause();
        }
        tick(t, e = !1) {
          let { resolved: r } = this;
          if (!r) {
            let { keyframes: t } = this.options;
            return { done: !0, value: t[t.length - 1] };
          }
          let {
            finalKeyframe: i,
            generator: n,
            mirroredGenerator: o,
            mapPercentToKeyframes: a,
            keyframes: s,
            calculatedDuration: l,
            totalDuration: u,
            resolvedDuration: c,
          } = r;
          if (null === this.startTime) return n.next(0);
          let { delay: d, repeat: h, repeatType: p, repeatDelay: f, onUpdate: m } = this.options;
          this.speed > 0
            ? (this.startTime = Math.min(this.startTime, t))
            : this.speed < 0 && (this.startTime = Math.min(t - u / this.speed, this.startTime)),
            e
              ? (this.currentTime = t)
              : null !== this.holdTime
                ? (this.currentTime = this.holdTime)
                : (this.currentTime = Math.round(t - this.startTime) * this.speed);
          let g = this.currentTime - d * (this.speed >= 0 ? 1 : -1),
            v = this.speed >= 0 ? g < 0 : g > u;
          (this.currentTime = Math.max(g, 0)),
            'finished' === this.state && null === this.holdTime && (this.currentTime = u);
          let y = this.currentTime,
            b = n;
          if (h) {
            let t = Math.min(this.currentTime, u) / c,
              e = Math.floor(t),
              r = t % 1;
            !r && t >= 1 && (r = 1),
              1 === r && e--,
              (e = Math.min(e, h + 1)) % 2 &&
                ('reverse' === p ? ((r = 1 - r), f && (r -= f / c)) : 'mirror' === p && (b = o)),
              (y = tq(0, 1, r) * c);
          }
          let x = v ? { done: !1, value: s[0] } : b.next(y);
          a && (x.value = a(x.value));
          let { done: S } = x;
          v || null === l || (S = this.speed >= 0 ? this.currentTime >= u : this.currentTime <= 0);
          let k =
            null === this.holdTime &&
            ('finished' === this.state || ('running' === this.state && S));
          return (
            k && void 0 !== i && (x.value = eZ(s, this.options, i)),
            m && m(x.value),
            k && this.finish(),
            x
          );
        }
        get duration() {
          let { resolved: t } = this;
          return t ? tu(t.calculatedDuration) : 0;
        }
        get time() {
          return tu(this.currentTime);
        }
        set time(t) {
          (t = tl(t)),
            (this.currentTime = t),
            null !== this.holdTime || 0 === this.speed
              ? (this.holdTime = t)
              : this.driver && (this.startTime = this.driver.now() - t / this.speed);
        }
        get speed() {
          return this.playbackSpeed;
        }
        set speed(t) {
          let e = this.playbackSpeed !== t;
          (this.playbackSpeed = t), e && (this.time = tu(this.currentTime));
        }
        play() {
          if ((this.resolver.isScheduled || this.resolver.resume(), !this._resolved)) {
            this.pendingPlayState = 'running';
            return;
          }
          if (this.isStopped) return;
          let { driver: t = rS, onPlay: e, startTime: r } = this.options;
          this.driver || (this.driver = t((t) => this.tick(t))), e && e();
          let i = this.driver.now();
          null !== this.holdTime
            ? (this.startTime = i - this.holdTime)
            : this.startTime
              ? 'finished' === this.state && (this.startTime = i)
              : (this.startTime = null != r ? r : this.calcStartTime()),
            'finished' === this.state && this.updateFinishedPromise(),
            (this.cancelTime = this.startTime),
            (this.holdTime = null),
            (this.state = 'running'),
            this.driver.start();
        }
        pause() {
          var t;
          if (!this._resolved) {
            this.pendingPlayState = 'paused';
            return;
          }
          (this.state = 'paused'),
            (this.holdTime = null !== (t = this.currentTime) && void 0 !== t ? t : 0);
        }
        complete() {
          'running' !== this.state && this.play(),
            (this.pendingPlayState = this.state = 'finished'),
            (this.holdTime = null);
        }
        finish() {
          this.teardown(), (this.state = 'finished');
          let { onComplete: t } = this.options;
          t && t();
        }
        cancel() {
          null !== this.cancelTime && this.tick(this.cancelTime),
            this.teardown(),
            this.updateFinishedPromise();
        }
        teardown() {
          (this.state = 'idle'),
            this.stopDriver(),
            this.resolveFinishedPromise(),
            this.updateFinishedPromise(),
            (this.startTime = this.cancelTime = null),
            this.resolver.cancel();
        }
        stopDriver() {
          this.driver && (this.driver.stop(), (this.driver = void 0));
        }
        sample(t) {
          return (this.startTime = 0), this.tick(t, !0);
        }
      }
      let rP = new Set(['opacity', 'clipPath', 'filter', 'transform']),
        rA = O(() => Object.hasOwnProperty.call(Element.prototype, 'animate')),
        rC = { anticipate: tU, backInOut: tN, circInOut: tX };
      class rE extends eJ {
        constructor(t) {
          super(t);
          let { name: e, motionValue: r, element: i, keyframes: n } = this.options;
          (this.resolver = new eG(n, (t, e) => this.onKeyframesResolved(t, e), e, r, i)),
            this.resolver.scheduleResolve();
        }
        initPlayback(t, e) {
          var r;
          let {
            duration: i = 300,
            times: n,
            ease: o,
            type: a,
            motionValue: s,
            name: l,
            startTime: u,
          } = this.options;
          if (!s.owner || !s.owner.current) return !1;
          if (
            ('string' == typeof o && Y() && o in rC && (o = rC[o]),
            W((r = this.options).type) ||
              'spring' === r.type ||
              !(function t(e) {
                return !!(
                  ('function' == typeof e && Y()) ||
                  !e ||
                  ('string' == typeof e && (e in K || Y())) ||
                  U(e) ||
                  (Array.isArray(e) && e.every(t))
                );
              })(r.ease))
          ) {
            let { onComplete: e, onUpdate: r, motionValue: s, element: l, ...u } = this.options,
              c = (function (t, e) {
                let r = new rT({ ...e, keyframes: t, repeat: 0, delay: 0, isGenerator: !0 }),
                  i = { done: !1, value: t[0] },
                  n = [],
                  o = 0;
                for (; !i.done && o < 2e4; ) n.push((i = r.sample(o)).value), (o += 10);
                return { times: void 0, keyframes: n, duration: o - 10, ease: 'linear' };
              })(t, u);
            1 === (t = c.keyframes).length && (t[1] = t[0]),
              (i = c.duration),
              (n = c.times),
              (o = c.ease),
              (a = 'keyframes');
          }
          let c = (function (
            t,
            e,
            r,
            {
              delay: i = 0,
              duration: n = 300,
              repeat: o = 0,
              repeatType: a = 'loop',
              ease: s = 'easeInOut',
              times: l,
            } = {}
          ) {
            let u = { [e]: r };
            l && (u.offset = l);
            let c = (function t(e, r) {
              if (e)
                return 'function' == typeof e && Y()
                  ? G(e, r)
                  : U(e)
                    ? q(e)
                    : Array.isArray(e)
                      ? e.map((e) => t(e, r) || K.easeOut)
                      : K[e];
            })(s, n);
            return (
              Array.isArray(c) && (u.easing = c),
              t.animate(u, {
                delay: i,
                duration: n,
                easing: Array.isArray(c) ? 'linear' : c,
                fill: 'both',
                iterations: o + 1,
                direction: 'reverse' === a ? 'alternate' : 'normal',
              })
            );
          })(s.owner.current, l, t, { ...this.options, duration: i, times: n, ease: o });
          return (
            (c.startTime = null != u ? u : this.calcStartTime()),
            this.pendingTimeline
              ? (N(c, this.pendingTimeline), (this.pendingTimeline = void 0))
              : (c.onfinish = () => {
                  let { onComplete: r } = this.options;
                  s.set(eZ(t, this.options, e)),
                    r && r(),
                    this.cancel(),
                    this.resolveFinishedPromise();
                }),
            { animation: c, duration: i, times: n, type: a, ease: o, keyframes: t }
          );
        }
        get duration() {
          let { resolved: t } = this;
          if (!t) return 0;
          let { duration: e } = t;
          return tu(e);
        }
        get time() {
          let { resolved: t } = this;
          if (!t) return 0;
          let { animation: e } = t;
          return tu(e.currentTime || 0);
        }
        set time(t) {
          let { resolved: e } = this;
          if (!e) return;
          let { animation: r } = e;
          r.currentTime = tl(t);
        }
        get speed() {
          let { resolved: t } = this;
          if (!t) return 1;
          let { animation: e } = t;
          return e.playbackRate;
        }
        set speed(t) {
          let { resolved: e } = this;
          if (!e) return;
          let { animation: r } = e;
          r.playbackRate = t;
        }
        get state() {
          let { resolved: t } = this;
          if (!t) return 'idle';
          let { animation: e } = t;
          return e.playState;
        }
        get startTime() {
          let { resolved: t } = this;
          if (!t) return null;
          let { animation: e } = t;
          return e.startTime;
        }
        attachTimeline(t) {
          if (this._resolved) {
            let { resolved: e } = this;
            if (!e) return tc;
            let { animation: r } = e;
            N(r, t);
          } else this.pendingTimeline = t;
          return tc;
        }
        play() {
          if (this.isStopped) return;
          let { resolved: t } = this;
          if (!t) return;
          let { animation: e } = t;
          'finished' === e.playState && this.updateFinishedPromise(), e.play();
        }
        pause() {
          let { resolved: t } = this;
          if (!t) return;
          let { animation: e } = t;
          e.pause();
        }
        stop() {
          if ((this.resolver.cancel(), (this.isStopped = !0), 'idle' === this.state)) return;
          this.resolveFinishedPromise(), this.updateFinishedPromise();
          let { resolved: t } = this;
          if (!t) return;
          let { animation: e, keyframes: r, duration: i, type: n, ease: o, times: a } = t;
          if ('idle' === e.playState || 'finished' === e.playState) return;
          if (this.time) {
            let { motionValue: t, onUpdate: e, onComplete: s, element: l, ...u } = this.options,
              c = new rT({
                ...u,
                keyframes: r,
                duration: i,
                type: n,
                ease: o,
                times: a,
                isGenerator: !0,
              }),
              d = tl(this.time);
            t.setWithVelocity(c.sample(d - 10).value, c.sample(d).value, 10);
          }
          let { onStop: s } = this.options;
          s && s(), this.cancel();
        }
        complete() {
          let { resolved: t } = this;
          t && t.animation.finish();
        }
        cancel() {
          let { resolved: t } = this;
          t && t.animation.cancel();
        }
        static supports(t) {
          let { motionValue: e, name: r, repeatDelay: i, repeatType: n, damping: o, type: a } = t;
          if (!e || !e.owner || !(e.owner.current instanceof HTMLElement)) return !1;
          let { onUpdate: s, transformTemplate: l } = e.owner.getProps();
          return (
            rA() && r && rP.has(r) && !s && !l && !i && 'mirror' !== n && 0 !== o && 'inertia' !== a
          );
        }
      }
      let rR = { type: 'spring', stiffness: 500, damping: 25, restSpeed: 10 },
        rj = (t) => ({
          type: 'spring',
          stiffness: 550,
          damping: 0 === t ? 2 * Math.sqrt(550) : 30,
          restSpeed: 10,
        }),
        r_ = { type: 'keyframes', duration: 0.8 },
        rM = { type: 'keyframes', ease: [0.25, 0.1, 0.35, 1], duration: 0.3 },
        rB = (t, { keyframes: e }) =>
          e.length > 2 ? r_ : th.has(t) ? (t.startsWith('scale') ? rj(e[1]) : rR) : rM,
        rD =
          (t, e, r, i = {}, n, o) =>
          (a) => {
            let s = F(i, t) || {},
              l = s.delay || i.delay || 0,
              { elapsed: u = 0 } = i;
            u -= tl(l);
            let c = {
              keyframes: Array.isArray(r) ? r : [null, r],
              ease: 'easeOut',
              velocity: e.getVelocity(),
              ...s,
              delay: -u,
              onUpdate: (t) => {
                e.set(t), s.onUpdate && s.onUpdate(t);
              },
              onComplete: () => {
                a(), s.onComplete && s.onComplete();
              },
              name: t,
              motionValue: e,
              element: o ? void 0 : n,
            };
            !(function ({
              when: t,
              delay: e,
              delayChildren: r,
              staggerChildren: i,
              staggerDirection: n,
              repeat: o,
              repeatType: a,
              repeatDelay: s,
              from: l,
              elapsed: u,
              ...c
            }) {
              return !!Object.keys(c).length;
            })(s) && (c = { ...c, ...rB(t, c) }),
              c.duration && (c.duration = tl(c.duration)),
              c.repeatDelay && (c.repeatDelay = tl(c.repeatDelay)),
              void 0 !== c.from && (c.keyframes[0] = c.from);
            let d = !1;
            if (
              ((!1 !== c.type && (0 !== c.duration || c.repeatDelay)) ||
                ((c.duration = 0), 0 !== c.delay || (d = !0)),
              (tO.current || tg.skipAnimations) && ((d = !0), (c.duration = 0), (c.delay = 0)),
              d && !o && void 0 !== e.get())
            ) {
              let t = eZ(c.keyframes, s);
              if (void 0 !== t)
                return (
                  tb.update(() => {
                    c.onUpdate(t), c.onComplete();
                  }),
                  new $([])
                );
            }
            return !o && rE.supports(c) ? new rE(c) : new rT(c);
          };
      function rL(t, e, { delay: r = 0, transitionOverride: i, type: n } = {}) {
        var o;
        let { transition: a = t.getDefaultTransition(), transitionEnd: s, ...l } = e;
        i && (a = i);
        let u = [],
          c = n && t.animationState && t.animationState.getState()[n];
        for (let e in l) {
          let i = t.getValue(e, null !== (o = t.latestValues[e]) && void 0 !== o ? o : null),
            n = l[e];
          if (
            void 0 === n ||
            (c &&
              (function ({ protectedKeys: t, needsAnimating: e }, r) {
                let i = t.hasOwnProperty(r) && !0 !== e[r];
                return (e[r] = !1), i;
              })(c, e))
          )
            continue;
          let s = { delay: r, ...F(a || {}, e) },
            d = !1;
          if (window.MotionHandoffAnimation) {
            let r = t.props[tL];
            if (r) {
              let t = window.MotionHandoffAnimation(r, e, tb);
              null !== t && ((s.startTime = t), (d = !0));
            }
          }
          tB(t, e),
            i.start(rD(e, i, n, t.shouldReduceMotion && tp.has(e) ? { type: !1 } : s, t, d));
          let h = i.animation;
          h && u.push(h);
        }
        return (
          s &&
            Promise.all(u).then(() => {
              tb.update(() => {
                s &&
                  (function (t, e) {
                    let { transitionEnd: r = {}, transition: i = {}, ...n } = B(t, e) || {};
                    for (let e in (n = { ...n, ...r })) {
                      let r = tm(n[e]);
                      t.hasValue(e) ? t.getValue(e).set(r) : t.addValue(e, t_(r));
                    }
                  })(t, s);
              });
            }),
          u
        );
      }
      function rO(t, e, r = {}) {
        var i;
        let n = B(
            t,
            e,
            'exit' === r.type
              ? null === (i = t.presenceContext) || void 0 === i
                ? void 0
                : i.custom
              : void 0
          ),
          { transition: o = t.getDefaultTransition() || {} } = n || {};
        r.transitionOverride && (o = r.transitionOverride);
        let a = n ? () => Promise.all(rL(t, n, r)) : () => Promise.resolve(),
          s =
            t.variantChildren && t.variantChildren.size
              ? (i = 0) => {
                  let { delayChildren: n = 0, staggerChildren: a, staggerDirection: s } = o;
                  return (function (t, e, r = 0, i = 0, n = 1, o) {
                    let a = [],
                      s = (t.variantChildren.size - 1) * i,
                      l = 1 === n ? (t = 0) => t * i : (t = 0) => s - t * i;
                    return (
                      Array.from(t.variantChildren)
                        .sort(rV)
                        .forEach((t, i) => {
                          t.notify('AnimationStart', e),
                            a.push(
                              rO(t, e, { ...o, delay: r + l(i) }).then(() =>
                                t.notify('AnimationComplete', e)
                              )
                            );
                        }),
                      Promise.all(a)
                    );
                  })(t, e, n + i, a, s, r);
                }
              : () => Promise.resolve(),
          { when: l } = o;
        if (!l) return Promise.all([a(), s(r.delay)]);
        {
          let [t, e] = 'beforeChildren' === l ? [a, s] : [s, a];
          return t().then(() => e());
        }
      }
      function rV(t, e) {
        return t.sortNodePosition(e);
      }
      let rI = L.length,
        r$ = [...D].reverse(),
        rF = D.length;
      function rz(t = !1) {
        return { isActive: t, protectedKeys: {}, needsAnimating: {}, prevResolvedValues: {} };
      }
      function rW() {
        return {
          animate: rz(!0),
          whileInView: rz(),
          whileHover: rz(),
          whileTap: rz(),
          whileDrag: rz(),
          whileFocus: rz(),
          exit: rz(),
        };
      }
      class rN {
        constructor(t) {
          (this.isMounted = !1), (this.node = t);
        }
        update() {}
      }
      class rU extends rN {
        constructor(t) {
          super(t),
            t.animationState ||
              (t.animationState = (function (t) {
                let e = (e) =>
                    Promise.all(
                      e.map(({ animation: e, options: r }) =>
                        (function (t, e, r = {}) {
                          let i;
                          if ((t.notify('AnimationStart', e), Array.isArray(e)))
                            i = Promise.all(e.map((e) => rO(t, e, r)));
                          else if ('string' == typeof e) i = rO(t, e, r);
                          else {
                            let n = 'function' == typeof e ? B(t, e, r.custom) : e;
                            i = Promise.all(rL(t, n, r));
                          }
                          return i.then(() => {
                            t.notify('AnimationComplete', e);
                          });
                        })(t, e, r)
                      )
                    ),
                  r = rW(),
                  i = !0,
                  n = (e) => (r, i) => {
                    var n;
                    let o = B(
                      t,
                      i,
                      'exit' === e
                        ? null === (n = t.presenceContext) || void 0 === n
                          ? void 0
                          : n.custom
                        : void 0
                    );
                    if (o) {
                      let { transition: t, transitionEnd: e, ...i } = o;
                      r = { ...r, ...i, ...e };
                    }
                    return r;
                  };
                function o(o) {
                  let { props: a } = t,
                    s =
                      (function t(e) {
                        if (!e) return;
                        if (!e.isControllingVariants) {
                          let r = (e.parent && t(e.parent)) || {};
                          return void 0 !== e.props.initial && (r.initial = e.props.initial), r;
                        }
                        let r = {};
                        for (let t = 0; t < rI; t++) {
                          let i = L[t],
                            n = e.props[i];
                          (j(n) || !1 === n) && (r[i] = n);
                        }
                        return r;
                      })(t.parent) || {},
                    l = [],
                    u = new Set(),
                    c = {},
                    d = 1 / 0;
                  for (let e = 0; e < rF; e++) {
                    var h;
                    let p = r$[e],
                      f = r[p],
                      m = void 0 !== a[p] ? a[p] : s[p],
                      g = j(m),
                      v = p === o ? f.isActive : null;
                    !1 === v && (d = e);
                    let y = m === s[p] && m !== a[p] && g;
                    if (
                      (y && i && t.manuallyAnimateOnMount && (y = !1),
                      (f.protectedKeys = { ...c }),
                      (!f.isActive && null === v) ||
                        (!m && !f.prevProp) ||
                        C(m) ||
                        'boolean' == typeof m)
                    )
                      continue;
                    let b =
                        ((h = f.prevProp),
                        'string' == typeof m ? m !== h : !!Array.isArray(m) && !R(m, h)),
                      x = b || (p === o && f.isActive && !y && g) || (e > d && g),
                      S = !1,
                      k = Array.isArray(m) ? m : [m],
                      w = k.reduce(n(p), {});
                    !1 === v && (w = {});
                    let { prevResolvedValues: T = {} } = f,
                      P = { ...T, ...w },
                      A = (e) => {
                        (x = !0), u.has(e) && ((S = !0), u.delete(e)), (f.needsAnimating[e] = !0);
                        let r = t.getValue(e);
                        r && (r.liveStyle = !1);
                      };
                    for (let t in P) {
                      let e = w[t],
                        r = T[t];
                      if (!c.hasOwnProperty(t))
                        (E(e) && E(r) ? R(e, r) : e === r)
                          ? void 0 !== e && u.has(t)
                            ? A(t)
                            : (f.protectedKeys[t] = !0)
                          : null != e
                            ? A(t)
                            : u.add(t);
                    }
                    (f.prevProp = m),
                      (f.prevResolvedValues = w),
                      f.isActive && (c = { ...c, ...w }),
                      i && t.blockInitialAnimation && (x = !1);
                    let _ = !(y && b) || S;
                    x && _ && l.push(...k.map((t) => ({ animation: t, options: { type: p } })));
                  }
                  if (u.size) {
                    let e = {};
                    u.forEach((r) => {
                      let i = t.getBaseTarget(r),
                        n = t.getValue(r);
                      n && (n.liveStyle = !0), (e[r] = null != i ? i : null);
                    }),
                      l.push({ animation: e });
                  }
                  let p = !!l.length;
                  return (
                    i &&
                      (!1 === a.initial || a.initial === a.animate) &&
                      !t.manuallyAnimateOnMount &&
                      (p = !1),
                    (i = !1),
                    p ? e(l) : Promise.resolve()
                  );
                }
                return {
                  animateChanges: o,
                  setActive: function (e, i) {
                    var n;
                    if (r[e].isActive === i) return Promise.resolve();
                    null === (n = t.variantChildren) ||
                      void 0 === n ||
                      n.forEach((t) => {
                        var r;
                        return null === (r = t.animationState) || void 0 === r
                          ? void 0
                          : r.setActive(e, i);
                      }),
                      (r[e].isActive = i);
                    let a = o(e);
                    for (let t in r) r[t].protectedKeys = {};
                    return a;
                  },
                  setAnimateFunction: function (r) {
                    e = r(t);
                  },
                  getState: () => r,
                  reset: () => {
                    (r = rW()), (i = !0);
                  },
                };
              })(t));
        }
        updateAnimationControlsSubscription() {
          let { animate: t } = this.node.getProps();
          C(t) && (this.unmountControls = t.subscribe(this.node));
        }
        mount() {
          this.updateAnimationControlsSubscription();
        }
        update() {
          let { animate: t } = this.node.getProps(),
            { animate: e } = this.node.prevProps || {};
          t !== e && this.updateAnimationControlsSubscription();
        }
        unmount() {
          var t;
          this.node.animationState.reset(),
            null === (t = this.unmountControls) || void 0 === t || t.call(this);
        }
      }
      let rH = 0;
      class rY extends rN {
        constructor() {
          super(...arguments), (this.id = rH++);
        }
        update() {
          if (!this.node.presenceContext) return;
          let { isPresent: t, onExitComplete: e } = this.node.presenceContext,
            { isPresent: r } = this.node.prevPresenceContext || {};
          if (!this.node.animationState || t === r) return;
          let i = this.node.animationState.setActive('exit', !t);
          e && !t && i.then(() => e(this.id));
        }
        mount() {
          let { register: t } = this.node.presenceContext || {};
          t && (this.unmount = t(this.id));
        }
        unmount() {}
      }
      function rX(t, e, r, i = { passive: !0 }) {
        return t.addEventListener(e, r, i), () => t.removeEventListener(e, r);
      }
      function rG(t) {
        return { point: { x: t.pageX, y: t.pageY } };
      }
      let rq = (t) => (e) => te(e) && t(e, rG(e));
      function rK(t, e, r, i) {
        return rX(t, e, rq(r), i);
      }
      let rZ = (t, e) => Math.abs(t - e);
      class rJ {
        constructor(
          t,
          e,
          { transformPagePoint: r, contextWindow: i, dragSnapToOrigin: n = !1 } = {}
        ) {
          if (
            ((this.startEvent = null),
            (this.lastMoveEvent = null),
            (this.lastMoveEventInfo = null),
            (this.handlers = {}),
            (this.contextWindow = window),
            (this.updatePoint = () => {
              var t, e;
              if (!(this.lastMoveEvent && this.lastMoveEventInfo)) return;
              let r = r1(this.lastMoveEventInfo, this.history),
                i = null !== this.startEvent,
                n =
                  ((t = r.offset),
                  (e = { x: 0, y: 0 }),
                  Math.sqrt(rZ(t.x, e.x) ** 2 + rZ(t.y, e.y) ** 2) >= 3);
              if (!i && !n) return;
              let { point: o } = r,
                { timestamp: a } = tS;
              this.history.push({ ...o, timestamp: a });
              let { onStart: s, onMove: l } = this.handlers;
              i || (s && s(this.lastMoveEvent, r), (this.startEvent = this.lastMoveEvent)),
                l && l(this.lastMoveEvent, r);
            }),
            (this.handlePointerMove = (t, e) => {
              (this.lastMoveEvent = t),
                (this.lastMoveEventInfo = rQ(e, this.transformPagePoint)),
                tb.update(this.updatePoint, !0);
            }),
            (this.handlePointerUp = (t, e) => {
              this.end();
              let { onEnd: r, onSessionEnd: i, resumeAnimation: n } = this.handlers;
              if (
                (this.dragSnapToOrigin && n && n(), !(this.lastMoveEvent && this.lastMoveEventInfo))
              )
                return;
              let o = r1(
                'pointercancel' === t.type
                  ? this.lastMoveEventInfo
                  : rQ(e, this.transformPagePoint),
                this.history
              );
              this.startEvent && r && r(t, o), i && i(t, o);
            }),
            !te(t))
          )
            return;
          (this.dragSnapToOrigin = n),
            (this.handlers = e),
            (this.transformPagePoint = r),
            (this.contextWindow = i || window);
          let o = rQ(rG(t), this.transformPagePoint),
            { point: a } = o,
            { timestamp: s } = tS;
          this.history = [{ ...a, timestamp: s }];
          let { onSessionStart: l } = e;
          l && l(t, r1(o, this.history)),
            (this.removeListeners = e8(
              rK(this.contextWindow, 'pointermove', this.handlePointerMove),
              rK(this.contextWindow, 'pointerup', this.handlePointerUp),
              rK(this.contextWindow, 'pointercancel', this.handlePointerUp)
            ));
        }
        updateHandlers(t) {
          this.handlers = t;
        }
        end() {
          this.removeListeners && this.removeListeners(), tx(this.updatePoint);
        }
      }
      function rQ(t, e) {
        return e ? { point: e(t.point) } : t;
      }
      function r0(t, e) {
        return { x: t.x - e.x, y: t.y - e.y };
      }
      function r1({ point: t }, e) {
        return {
          point: t,
          delta: r0(t, r5(e)),
          offset: r0(t, e[0]),
          velocity: (function (t, e) {
            if (t.length < 2) return { x: 0, y: 0 };
            let r = t.length - 1,
              i = null,
              n = r5(t);
            for (; r >= 0 && ((i = t[r]), !(n.timestamp - i.timestamp > tl(0.1))); ) r--;
            if (!i) return { x: 0, y: 0 };
            let o = tu(n.timestamp - i.timestamp);
            if (0 === o) return { x: 0, y: 0 };
            let a = { x: (n.x - i.x) / o, y: (n.y - i.y) / o };
            return a.x === 1 / 0 && (a.x = 0), a.y === 1 / 0 && (a.y = 0), a;
          })(e, 0),
        };
      }
      function r5(t) {
        return t[t.length - 1];
      }
      function r2(t) {
        return t && 'object' == typeof t && Object.prototype.hasOwnProperty.call(t, 'current');
      }
      function r3(t) {
        return t.max - t.min;
      }
      function r4(t, e, r, i = 0.5) {
        (t.origin = i),
          (t.originPoint = eQ(e.min, e.max, t.origin)),
          (t.scale = r3(r) / r3(e)),
          (t.translate = eQ(r.min, r.max, t.origin) - t.originPoint),
          ((t.scale >= 0.9999 && t.scale <= 1.0001) || isNaN(t.scale)) && (t.scale = 1),
          ((t.translate >= -0.01 && t.translate <= 0.01) || isNaN(t.translate)) &&
            (t.translate = 0);
      }
      function r9(t, e, r, i) {
        r4(t.x, e.x, r.x, i ? i.originX : void 0), r4(t.y, e.y, r.y, i ? i.originY : void 0);
      }
      function r6(t, e, r) {
        (t.min = r.min + e.min), (t.max = t.min + r3(e));
      }
      function r8(t, e, r) {
        (t.min = e.min - r.min), (t.max = t.min + r3(e));
      }
      function r7(t, e, r) {
        r8(t.x, e.x, r.x), r8(t.y, e.y, r.y);
      }
      function it(t, e, r) {
        return {
          min: void 0 !== e ? t.min + e : void 0,
          max: void 0 !== r ? t.max + r - (t.max - t.min) : void 0,
        };
      }
      function ie(t, e) {
        let r = e.min - t.min,
          i = e.max - t.max;
        return e.max - e.min < t.max - t.min && ([r, i] = [i, r]), { min: r, max: i };
      }
      function ir(t, e, r) {
        return { min: ii(t, e), max: ii(t, r) };
      }
      function ii(t, e) {
        return 'number' == typeof t ? t : t[e] || 0;
      }
      let io = () => ({ translate: 0, scale: 1, origin: 0, originPoint: 0 }),
        ia = () => ({ x: io(), y: io() }),
        is = () => ({ min: 0, max: 0 }),
        il = () => ({ x: is(), y: is() });
      function iu(t) {
        return [t('x'), t('y')];
      }
      function ic({ top: t, left: e, right: r, bottom: i }) {
        return { x: { min: e, max: r }, y: { min: t, max: i } };
      }
      function id(t) {
        return void 0 === t || 1 === t;
      }
      function ih({ scale: t, scaleX: e, scaleY: r }) {
        return !id(t) || !id(e) || !id(r);
      }
      function ip(t) {
        return ih(t) || im(t) || t.z || t.rotate || t.rotateX || t.rotateY || t.skewX || t.skewY;
      }
      function im(t) {
        var e, r;
        return ((e = t.x) && '0%' !== e) || ((r = t.y) && '0%' !== r);
      }
      function ig(t, e, r, i, n) {
        return void 0 !== n && (t = i + n * (t - i)), i + r * (t - i) + e;
      }
      function iv(t, e = 0, r = 1, i, n) {
        (t.min = ig(t.min, e, r, i, n)), (t.max = ig(t.max, e, r, i, n));
      }
      function iy(t, { x: e, y: r }) {
        iv(t.x, e.translate, e.scale, e.originPoint), iv(t.y, r.translate, r.scale, r.originPoint);
      }
      function ib(t, e) {
        (t.min = t.min + e), (t.max = t.max + e);
      }
      function ix(t, e, r, i, n = 0.5) {
        let o = eQ(t.min, t.max, n);
        iv(t, e, r, o, i);
      }
      function iS(t, e) {
        ix(t.x, e.x, e.scaleX, e.scale, e.originX), ix(t.y, e.y, e.scaleY, e.scale, e.originY);
      }
      function ik(t, e) {
        return ic(
          (function (t, e) {
            if (!e) return t;
            let r = e({ x: t.left, y: t.top }),
              i = e({ x: t.right, y: t.bottom });
            return { top: r.y, left: r.x, bottom: i.y, right: i.x };
          })(t.getBoundingClientRect(), e)
        );
      }
      let iw = ({ current: t }) => (t ? t.ownerDocument.defaultView : null),
        iT = new WeakMap();
      class iP {
        constructor(t) {
          (this.openDragLock = null),
            (this.isDragging = !1),
            (this.currentDirection = null),
            (this.originPoint = { x: 0, y: 0 }),
            (this.constraints = !1),
            (this.hasMutatedConstraints = !1),
            (this.elastic = il()),
            (this.visualElement = t);
        }
        start(t, { snapToCursor: e = !1 } = {}) {
          let { presenceContext: r } = this.visualElement;
          if (r && !1 === r.isPresent) return;
          let { dragSnapToOrigin: i } = this.getProps();
          this.panSession = new rJ(
            t,
            {
              onSessionStart: (t) => {
                let { dragSnapToOrigin: r } = this.getProps();
                r ? this.pauseAnimation() : this.stopAnimation(),
                  e && this.snapToCursor(rG(t).point);
              },
              onStart: (t, e) => {
                let { drag: r, dragPropagation: i, onDragStart: n } = this.getProps();
                if (
                  r &&
                  !i &&
                  (this.openDragLock && this.openDragLock(),
                  (this.openDragLock =
                    'x' === r || 'y' === r
                      ? Z[r]
                        ? null
                        : ((Z[r] = !0),
                          () => {
                            Z[r] = !1;
                          })
                      : Z.x || Z.y
                        ? null
                        : ((Z.x = Z.y = !0),
                          () => {
                            Z.x = Z.y = !1;
                          })),
                  !this.openDragLock)
                )
                  return;
                (this.isDragging = !0),
                  (this.currentDirection = null),
                  this.resolveConstraints(),
                  this.visualElement.projection &&
                    ((this.visualElement.projection.isAnimationBlocked = !0),
                    (this.visualElement.projection.target = void 0)),
                  iu((t) => {
                    let e = this.getAxisMotionValue(t).get() || 0;
                    if (et.test(e)) {
                      let { projection: r } = this.visualElement;
                      if (r && r.layout) {
                        let i = r.layout.layoutBox[t];
                        if (i) {
                          let t = r3(i);
                          e = (parseFloat(e) / 100) * t;
                        }
                      }
                    }
                    this.originPoint[t] = e;
                  }),
                  n && tb.postRender(() => n(t, e)),
                  tB(this.visualElement, 'transform');
                let { animationState: o } = this.visualElement;
                o && o.setActive('whileDrag', !0);
              },
              onMove: (t, e) => {
                let {
                  dragPropagation: r,
                  dragDirectionLock: i,
                  onDirectionLock: n,
                  onDrag: o,
                } = this.getProps();
                if (!r && !this.openDragLock) return;
                let { offset: a } = e;
                if (i && null === this.currentDirection) {
                  (this.currentDirection = (function (t, e = 10) {
                    let r = null;
                    return Math.abs(t.y) > e ? (r = 'y') : Math.abs(t.x) > e && (r = 'x'), r;
                  })(a)),
                    null !== this.currentDirection && n && n(this.currentDirection);
                  return;
                }
                this.updateAxis('x', e.point, a),
                  this.updateAxis('y', e.point, a),
                  this.visualElement.render(),
                  o && o(t, e);
              },
              onSessionEnd: (t, e) => this.stop(t, e),
              resumeAnimation: () =>
                iu((t) => {
                  var e;
                  return (
                    'paused' === this.getAnimationState(t) &&
                    (null === (e = this.getAxisMotionValue(t).animation) || void 0 === e
                      ? void 0
                      : e.play())
                  );
                }),
            },
            {
              transformPagePoint: this.visualElement.getTransformPagePoint(),
              dragSnapToOrigin: i,
              contextWindow: iw(this.visualElement),
            }
          );
        }
        stop(t, e) {
          let r = this.isDragging;
          if ((this.cancel(), !r)) return;
          let { velocity: i } = e;
          this.startAnimation(i);
          let { onDragEnd: n } = this.getProps();
          n && tb.postRender(() => n(t, e));
        }
        cancel() {
          this.isDragging = !1;
          let { projection: t, animationState: e } = this.visualElement;
          t && (t.isAnimationBlocked = !1),
            this.panSession && this.panSession.end(),
            (this.panSession = void 0);
          let { dragPropagation: r } = this.getProps();
          !r && this.openDragLock && (this.openDragLock(), (this.openDragLock = null)),
            e && e.setActive('whileDrag', !1);
        }
        updateAxis(t, e, r) {
          let { drag: i } = this.getProps();
          if (!r || !iA(t, i, this.currentDirection)) return;
          let n = this.getAxisMotionValue(t),
            o = this.originPoint[t] + r[t];
          this.constraints &&
            this.constraints[t] &&
            (o = (function (t, { min: e, max: r }, i) {
              return (
                void 0 !== e && t < e
                  ? (t = i ? eQ(e, t, i.min) : Math.max(t, e))
                  : void 0 !== r && t > r && (t = i ? eQ(r, t, i.max) : Math.min(t, r)),
                t
              );
            })(o, this.constraints[t], this.elastic[t])),
            n.set(o);
        }
        resolveConstraints() {
          var t;
          let { dragConstraints: e, dragElastic: r } = this.getProps(),
            i =
              this.visualElement.projection && !this.visualElement.projection.layout
                ? this.visualElement.projection.measure(!1)
                : null === (t = this.visualElement.projection) || void 0 === t
                  ? void 0
                  : t.layout,
            n = this.constraints;
          e && r2(e)
            ? this.constraints || (this.constraints = this.resolveRefConstraints())
            : e && i
              ? (this.constraints = (function (t, { top: e, left: r, bottom: i, right: n }) {
                  return { x: it(t.x, r, n), y: it(t.y, e, i) };
                })(i.layoutBox, e))
              : (this.constraints = !1),
            (this.elastic = (function (t = 0.35) {
              return (
                !1 === t ? (t = 0) : !0 === t && (t = 0.35),
                { x: ir(t, 'left', 'right'), y: ir(t, 'top', 'bottom') }
              );
            })(r)),
            n !== this.constraints &&
              i &&
              this.constraints &&
              !this.hasMutatedConstraints &&
              iu((t) => {
                !1 !== this.constraints &&
                  this.getAxisMotionValue(t) &&
                  (this.constraints[t] = (function (t, e) {
                    let r = {};
                    return (
                      void 0 !== e.min && (r.min = e.min - t.min),
                      void 0 !== e.max && (r.max = e.max - t.min),
                      r
                    );
                  })(i.layoutBox[t], this.constraints[t]));
              });
        }
        resolveRefConstraints() {
          var t;
          let { dragConstraints: e, onMeasureDragConstraints: r } = this.getProps();
          if (!e || !r2(e)) return !1;
          let i = e.current;
          tc(
            null !== i,
            "If `dragConstraints` is set as a React ref, that ref must be passed to another component's `ref` prop."
          );
          let { projection: n } = this.visualElement;
          if (!n || !n.layout) return !1;
          let o = (function (t, e, r) {
              let i = ik(t, r),
                { scroll: n } = e;
              return n && (ib(i.x, n.offset.x), ib(i.y, n.offset.y)), i;
            })(i, n.root, this.visualElement.getTransformPagePoint()),
            a = { x: ie((t = n.layout.layoutBox).x, o.x), y: ie(t.y, o.y) };
          if (r) {
            let t = r(
              (function ({ x: t, y: e }) {
                return { top: e.min, right: t.max, bottom: e.max, left: t.min };
              })(a)
            );
            (this.hasMutatedConstraints = !!t), t && (a = ic(t));
          }
          return a;
        }
        startAnimation(t) {
          let {
              drag: e,
              dragMomentum: r,
              dragElastic: i,
              dragTransition: n,
              dragSnapToOrigin: o,
              onDragTransitionEnd: a,
            } = this.getProps(),
            s = this.constraints || {};
          return Promise.all(
            iu((a) => {
              if (!iA(a, e, this.currentDirection)) return;
              let l = (s && s[a]) || {};
              o && (l = { min: 0, max: 0 });
              let u = {
                type: 'inertia',
                velocity: r ? t[a] : 0,
                bounceStiffness: i ? 200 : 1e6,
                bounceDamping: i ? 40 : 1e7,
                timeConstant: 750,
                restDelta: 1,
                restSpeed: 10,
                ...n,
                ...l,
              };
              return this.startAxisValueAnimation(a, u);
            })
          ).then(a);
        }
        startAxisValueAnimation(t, e) {
          let r = this.getAxisMotionValue(t);
          return tB(this.visualElement, t), r.start(rD(t, r, 0, e, this.visualElement, !1));
        }
        stopAnimation() {
          iu((t) => this.getAxisMotionValue(t).stop());
        }
        pauseAnimation() {
          iu((t) => {
            var e;
            return null === (e = this.getAxisMotionValue(t).animation) || void 0 === e
              ? void 0
              : e.pause();
          });
        }
        getAnimationState(t) {
          var e;
          return null === (e = this.getAxisMotionValue(t).animation) || void 0 === e
            ? void 0
            : e.state;
        }
        getAxisMotionValue(t) {
          let e = `_drag${t.toUpperCase()}`,
            r = this.visualElement.getProps();
          return r[e] || this.visualElement.getValue(t, (r.initial ? r.initial[t] : void 0) || 0);
        }
        snapToCursor(t) {
          iu((e) => {
            let { drag: r } = this.getProps();
            if (!iA(e, r, this.currentDirection)) return;
            let { projection: i } = this.visualElement,
              n = this.getAxisMotionValue(e);
            if (i && i.layout) {
              let { min: r, max: o } = i.layout.layoutBox[e];
              n.set(t[e] - eQ(r, o, 0.5));
            }
          });
        }
        scalePositionWithinConstraints() {
          if (!this.visualElement.current) return;
          let { drag: t, dragConstraints: e } = this.getProps(),
            { projection: r } = this.visualElement;
          if (!r2(e) || !r || !this.constraints) return;
          this.stopAnimation();
          let i = { x: 0, y: 0 };
          iu((t) => {
            let e = this.getAxisMotionValue(t);
            if (e && !1 !== this.constraints) {
              let r = e.get();
              i[t] = (function (t, e) {
                let r = 0.5,
                  i = r3(t),
                  n = r3(e);
                return (
                  n > i
                    ? (r = X(e.min, e.max - i, t.min))
                    : i > n && (r = X(t.min, t.max - n, e.min)),
                  tq(0, 1, r)
                );
              })({ min: r, max: r }, this.constraints[t]);
            }
          });
          let { transformTemplate: n } = this.visualElement.getProps();
          (this.visualElement.current.style.transform = n ? n({}, '') : 'none'),
            r.root && r.root.updateScroll(),
            r.updateLayout(),
            this.resolveConstraints(),
            iu((e) => {
              if (!iA(e, t, null)) return;
              let r = this.getAxisMotionValue(e),
                { min: n, max: o } = this.constraints[e];
              r.set(eQ(n, o, i[e]));
            });
        }
        addListeners() {
          if (!this.visualElement.current) return;
          iT.set(this.visualElement, this);
          let t = rK(this.visualElement.current, 'pointerdown', (t) => {
              let { drag: e, dragListener: r = !0 } = this.getProps();
              e && r && this.start(t);
            }),
            e = () => {
              let { dragConstraints: t } = this.getProps();
              r2(t) && t.current && (this.constraints = this.resolveRefConstraints());
            },
            { projection: r } = this.visualElement,
            i = r.addEventListener('measure', e);
          r && !r.layout && (r.root && r.root.updateScroll(), r.updateLayout()), tb.read(e);
          let n = rX(window, 'resize', () => this.scalePositionWithinConstraints()),
            o = r.addEventListener('didUpdate', ({ delta: t, hasLayoutChanged: e }) => {
              this.isDragging &&
                e &&
                (iu((e) => {
                  let r = this.getAxisMotionValue(e);
                  r && ((this.originPoint[e] += t[e].translate), r.set(r.get() + t[e].translate));
                }),
                this.visualElement.render());
            });
          return () => {
            n(), t(), i(), o && o();
          };
        }
        getProps() {
          let t = this.visualElement.getProps(),
            {
              drag: e = !1,
              dragDirectionLock: r = !1,
              dragPropagation: i = !1,
              dragConstraints: n = !1,
              dragElastic: o = 0.35,
              dragMomentum: a = !0,
            } = t;
          return {
            ...t,
            drag: e,
            dragDirectionLock: r,
            dragPropagation: i,
            dragConstraints: n,
            dragElastic: o,
            dragMomentum: a,
          };
        }
      }
      function iA(t, e, r) {
        return (!0 === e || e === t) && (null === r || r === t);
      }
      class iC extends rN {
        constructor(t) {
          super(t),
            (this.removeGroupControls = tc),
            (this.removeListeners = tc),
            (this.controls = new iP(t));
        }
        mount() {
          let { dragControls: t } = this.node.getProps();
          t && (this.removeGroupControls = t.subscribe(this.controls)),
            (this.removeListeners = this.controls.addListeners() || tc);
        }
        unmount() {
          this.removeGroupControls(), this.removeListeners();
        }
      }
      let iE = (t) => (e, r) => {
        t && tb.postRender(() => t(e, r));
      };
      class iR extends rN {
        constructor() {
          super(...arguments), (this.removePointerDownListener = tc);
        }
        onPointerDown(t) {
          this.session = new rJ(t, this.createPanHandlers(), {
            transformPagePoint: this.node.getTransformPagePoint(),
            contextWindow: iw(this.node),
          });
        }
        createPanHandlers() {
          let { onPanSessionStart: t, onPanStart: e, onPan: r, onPanEnd: i } = this.node.getProps();
          return {
            onSessionStart: iE(t),
            onStart: iE(e),
            onMove: r,
            onEnd: (t, e) => {
              delete this.session, i && tb.postRender(() => i(t, e));
            },
          };
        }
        mount() {
          this.removePointerDownListener = rK(this.node.current, 'pointerdown', (t) =>
            this.onPointerDown(t)
          );
        }
        update() {
          this.session && this.session.updateHandlers(this.createPanHandlers());
        }
        unmount() {
          this.removePointerDownListener(), this.session && this.session.end();
        }
      }
      let ij = (0, c.createContext)({}),
        i_ = { hasAnimatedSinceResize: !0, hasEverUpdated: !1 };
      function iM(t, e) {
        return e.max === e.min ? 0 : (t / (e.max - e.min)) * 100;
      }
      let iB = {
          correct: (t, e) => {
            if (!e.target) return t;
            if ('string' == typeof t) {
              if (!ee.test(t)) return t;
              t = parseFloat(t);
            }
            let r = iM(t, e.target.x),
              i = iM(t, e.target.y);
            return `${r}% ${i}%`;
          },
        },
        iD = {},
        { schedule: iL, cancel: iO } = ty(queueMicrotask, !1);
      class iV extends c.Component {
        componentDidMount() {
          let { visualElement: t, layoutGroup: e, switchLayoutGroup: r, layoutId: i } = this.props,
            { projection: n } = t;
          Object.assign(iD, i$),
            n &&
              (e.group && e.group.add(n),
              r && r.register && i && r.register(n),
              n.root.didUpdate(),
              n.addEventListener('animationComplete', () => {
                this.safeToRemove();
              }),
              n.setOptions({ ...n.options, onExitComplete: () => this.safeToRemove() })),
            (i_.hasEverUpdated = !0);
        }
        getSnapshotBeforeUpdate(t) {
          let { layoutDependency: e, visualElement: r, drag: i, isPresent: n } = this.props,
            o = r.projection;
          return (
            o &&
              ((o.isPresent = n),
              i || t.layoutDependency !== e || void 0 === e ? o.willUpdate() : this.safeToRemove(),
              t.isPresent === n ||
                (n
                  ? o.promote()
                  : o.relegate() ||
                    tb.postRender(() => {
                      let t = o.getStack();
                      (t && t.members.length) || this.safeToRemove();
                    }))),
            null
          );
        }
        componentDidUpdate() {
          let { projection: t } = this.props.visualElement;
          t &&
            (t.root.didUpdate(),
            iL.postRender(() => {
              !t.currentAnimation && t.isLead() && this.safeToRemove();
            }));
        }
        componentWillUnmount() {
          let { visualElement: t, layoutGroup: e, switchLayoutGroup: r } = this.props,
            { projection: i } = t;
          i &&
            (i.scheduleCheckAfterUnmount(),
            e && e.group && e.group.remove(i),
            r && r.deregister && r.deregister(i));
        }
        safeToRemove() {
          let { safeToRemove: t } = this.props;
          t && t();
        }
        render() {
          return null;
        }
      }
      function iI(t) {
        let [e, r] = b(),
          i = (0, c.useContext)(d);
        return (0, l.jsx)(iV, {
          ...t,
          layoutGroup: i,
          switchLayoutGroup: (0, c.useContext)(ij),
          isPresent: e,
          safeToRemove: r,
        });
      }
      let i$ = {
          borderRadius: {
            ...iB,
            applyTo: [
              'borderTopLeftRadius',
              'borderTopRightRadius',
              'borderBottomLeftRadius',
              'borderBottomRightRadius',
            ],
          },
          borderTopLeftRadius: iB,
          borderTopRightRadius: iB,
          borderBottomLeftRadius: iB,
          borderBottomRightRadius: iB,
          boxShadow: {
            correct: (t, { treeScale: e, projectionDelta: r }) => {
              let i = em.parse(t);
              if (i.length > 5) return t;
              let n = em.createTransformer(t),
                o = 'number' != typeof i[0] ? 1 : 0,
                a = r.x.scale * e.x,
                s = r.y.scale * e.y;
              (i[0 + o] /= a), (i[1 + o] /= s);
              let l = eQ(a, s, 0.5);
              return (
                'number' == typeof i[2 + o] && (i[2 + o] /= l),
                'number' == typeof i[3 + o] && (i[3 + o] /= l),
                n(i)
              );
            },
          },
        },
        iF = (t, e) => t.depth - e.depth;
      class iz {
        constructor() {
          (this.children = []), (this.isDirty = !1);
        }
        add(t) {
          tP(this.children, t), (this.isDirty = !0);
        }
        remove(t) {
          tA(this.children, t), (this.isDirty = !0);
        }
        forEach(t) {
          this.isDirty && this.children.sort(iF), (this.isDirty = !1), this.children.forEach(t);
        }
      }
      function iW(t) {
        let e = tM(t) ? t.get() : t;
        return tf(e) ? e.toValue() : e;
      }
      let iN = ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'],
        iU = iN.length,
        iH = (t) => ('string' == typeof t ? parseFloat(t) : t),
        iY = (t) => 'number' == typeof t || ee.test(t);
      function iX(t, e) {
        return void 0 !== t[e] ? t[e] : t.borderRadius;
      }
      let iG = iK(0, 0.5, tY),
        iq = iK(0.5, 0.95, tc);
      function iK(t, e, r) {
        return (i) => (i < t ? 0 : i > e ? 1 : r(X(t, e, i)));
      }
      function iZ(t, e) {
        (t.min = e.min), (t.max = e.max);
      }
      function iJ(t, e) {
        iZ(t.x, e.x), iZ(t.y, e.y);
      }
      function iQ(t, e) {
        (t.translate = e.translate),
          (t.scale = e.scale),
          (t.originPoint = e.originPoint),
          (t.origin = e.origin);
      }
      function i0(t, e, r, i, n) {
        return (
          (t -= e), (t = i + (1 / r) * (t - i)), void 0 !== n && (t = i + (1 / n) * (t - i)), t
        );
      }
      function i1(t, e, [r, i, n], o, a) {
        !(function (t, e = 0, r = 1, i = 0.5, n, o = t, a = t) {
          if (
            (et.test(e) && ((e = parseFloat(e)), (e = eQ(a.min, a.max, e / 100) - a.min)),
            'number' != typeof e)
          )
            return;
          let s = eQ(o.min, o.max, i);
          t === o && (s -= e), (t.min = i0(t.min, e, r, s, n)), (t.max = i0(t.max, e, r, s, n));
        })(t, e[r], e[i], e[n], e.scale, o, a);
      }
      let i5 = ['x', 'scaleX', 'originX'],
        i2 = ['y', 'scaleY', 'originY'];
      function i3(t, e, r, i) {
        i1(t.x, e, i5, r ? r.x : void 0, i ? i.x : void 0),
          i1(t.y, e, i2, r ? r.y : void 0, i ? i.y : void 0);
      }
      function i4(t) {
        return 0 === t.translate && 1 === t.scale;
      }
      function i9(t) {
        return i4(t.x) && i4(t.y);
      }
      function i6(t, e) {
        return t.min === e.min && t.max === e.max;
      }
      function i8(t, e) {
        return Math.round(t.min) === Math.round(e.min) && Math.round(t.max) === Math.round(e.max);
      }
      function i7(t, e) {
        return i8(t.x, e.x) && i8(t.y, e.y);
      }
      function nt(t) {
        return r3(t.x) / r3(t.y);
      }
      function ne(t, e) {
        return (
          t.translate === e.translate && t.scale === e.scale && t.originPoint === e.originPoint
        );
      }
      class nr {
        constructor() {
          this.members = [];
        }
        add(t) {
          tP(this.members, t), t.scheduleRender();
        }
        remove(t) {
          if (
            (tA(this.members, t), t === this.prevLead && (this.prevLead = void 0), t === this.lead)
          ) {
            let t = this.members[this.members.length - 1];
            t && this.promote(t);
          }
        }
        relegate(t) {
          let e;
          let r = this.members.findIndex((e) => t === e);
          if (0 === r) return !1;
          for (let t = r; t >= 0; t--) {
            let r = this.members[t];
            if (!1 !== r.isPresent) {
              e = r;
              break;
            }
          }
          return !!e && (this.promote(e), !0);
        }
        promote(t, e) {
          let r = this.lead;
          if (t !== r && ((this.prevLead = r), (this.lead = t), t.show(), r)) {
            r.instance && r.scheduleRender(),
              t.scheduleRender(),
              (t.resumeFrom = r),
              e && (t.resumeFrom.preserveOpacity = !0),
              r.snapshot &&
                ((t.snapshot = r.snapshot),
                (t.snapshot.latestValues = r.animationValues || r.latestValues)),
              t.root && t.root.isUpdating && (t.isLayoutDirty = !0);
            let { crossfade: i } = t.options;
            !1 === i && r.hide();
          }
        }
        exitAnimationComplete() {
          this.members.forEach((t) => {
            let { options: e, resumingFrom: r } = t;
            e.onExitComplete && e.onExitComplete(),
              r && r.options.onExitComplete && r.options.onExitComplete();
          });
        }
        scheduleRender() {
          this.members.forEach((t) => {
            t.instance && t.scheduleRender(!1);
          });
        }
        removeLeadSnapshot() {
          this.lead && this.lead.snapshot && (this.lead.snapshot = void 0);
        }
      }
      let ni = {
          type: 'projectionFrame',
          totalNodes: 0,
          resolvedTargetDeltas: 0,
          recalculatedProjection: 0,
        },
        nn = 'undefined' != typeof window && void 0 !== window.MotionDebug,
        no = ['', 'X', 'Y', 'Z'],
        na = { visibility: 'hidden' },
        ns = 0;
      function nl(t, e, r, i) {
        let { latestValues: n } = e;
        n[t] && ((r[t] = n[t]), e.setStaticValue(t, 0), i && (i[t] = 0));
      }
      function nu({
        attachResizeListener: t,
        defaultParent: e,
        measureScroll: r,
        checkIsScrollRoot: i,
        resetTransform: n,
      }) {
        return class {
          constructor(t = {}, r = null == e ? void 0 : e()) {
            (this.id = ns++),
              (this.animationId = 0),
              (this.children = new Set()),
              (this.options = {}),
              (this.isTreeAnimating = !1),
              (this.isAnimationBlocked = !1),
              (this.isLayoutDirty = !1),
              (this.isProjectionDirty = !1),
              (this.isSharedProjectionDirty = !1),
              (this.isTransformDirty = !1),
              (this.updateManuallyBlocked = !1),
              (this.updateBlockedByResize = !1),
              (this.isUpdating = !1),
              (this.isSVG = !1),
              (this.needsReset = !1),
              (this.shouldResetTransform = !1),
              (this.hasCheckedOptimisedAppear = !1),
              (this.treeScale = { x: 1, y: 1 }),
              (this.eventHandlers = new Map()),
              (this.hasTreeAnimated = !1),
              (this.updateScheduled = !1),
              (this.scheduleUpdate = () => this.update()),
              (this.projectionUpdateScheduled = !1),
              (this.checkUpdateFailed = () => {
                this.isUpdating && ((this.isUpdating = !1), this.clearAllSnapshots());
              }),
              (this.updateProjection = () => {
                (this.projectionUpdateScheduled = !1),
                  nn && (ni.totalNodes = ni.resolvedTargetDeltas = ni.recalculatedProjection = 0),
                  this.nodes.forEach(nh),
                  this.nodes.forEach(nb),
                  this.nodes.forEach(nx),
                  this.nodes.forEach(np),
                  nn && window.MotionDebug.record(ni);
              }),
              (this.resolvedRelativeTargetAt = 0),
              (this.hasProjected = !1),
              (this.isVisible = !0),
              (this.animationProgress = 0),
              (this.sharedNodes = new Map()),
              (this.latestValues = t),
              (this.root = r ? r.root || r : this),
              (this.path = r ? [...r.path, r] : []),
              (this.parent = r),
              (this.depth = r ? r.depth + 1 : 0);
            for (let t = 0; t < this.path.length; t++) this.path[t].shouldResetTransform = !0;
            this.root === this && (this.nodes = new iz());
          }
          addEventListener(t, e) {
            return (
              this.eventHandlers.has(t) || this.eventHandlers.set(t, new tC()),
              this.eventHandlers.get(t).add(e)
            );
          }
          notifyListeners(t, ...e) {
            let r = this.eventHandlers.get(t);
            r && r.notify(...e);
          }
          hasListeners(t) {
            return this.eventHandlers.has(t);
          }
          mount(e, r = this.root.hasTreeAnimated) {
            if (this.instance) return;
            (this.isSVG = e instanceof SVGElement && 'svg' !== e.tagName), (this.instance = e);
            let { layoutId: i, layout: n, visualElement: o } = this.options;
            if (
              (o && !o.current && o.mount(e),
              this.root.nodes.add(this),
              this.parent && this.parent.children.add(this),
              r && (n || i) && (this.isLayoutDirty = !0),
              t)
            ) {
              let r;
              let i = () => (this.root.updateBlockedByResize = !1);
              t(e, () => {
                (this.root.updateBlockedByResize = !0),
                  r && r(),
                  (r = (function (t, e) {
                    let r = tT.now(),
                      i = ({ timestamp: e }) => {
                        let n = e - r;
                        n >= 250 && (tx(i), t(n - 250));
                      };
                    return tb.read(i, !0), () => tx(i);
                  })(i, 0)),
                  i_.hasAnimatedSinceResize &&
                    ((i_.hasAnimatedSinceResize = !1), this.nodes.forEach(ny));
              });
            }
            i && this.root.registerSharedNode(i, this),
              !1 !== this.options.animate &&
                o &&
                (i || n) &&
                this.addEventListener(
                  'didUpdate',
                  ({ delta: t, hasLayoutChanged: e, hasRelativeTargetChanged: r, layout: i }) => {
                    if (this.isTreeAnimationBlocked()) {
                      (this.target = void 0), (this.relativeTarget = void 0);
                      return;
                    }
                    let n = this.options.transition || o.getDefaultTransition() || nA,
                      { onLayoutAnimationStart: a, onLayoutAnimationComplete: s } = o.getProps(),
                      l = !this.targetLayout || !i7(this.targetLayout, i) || r,
                      u = !e && r;
                    if (
                      this.options.layoutRoot ||
                      (this.resumeFrom && this.resumeFrom.instance) ||
                      u ||
                      (e && (l || !this.currentAnimation))
                    ) {
                      this.resumeFrom &&
                        ((this.resumingFrom = this.resumeFrom),
                        (this.resumingFrom.resumingFrom = void 0)),
                        this.setAnimationOrigin(t, u);
                      let e = { ...F(n, 'layout'), onPlay: a, onComplete: s };
                      (o.shouldReduceMotion || this.options.layoutRoot) &&
                        ((e.delay = 0), (e.type = !1)),
                        this.startAnimation(e);
                    } else
                      e || ny(this),
                        this.isLead() &&
                          this.options.onExitComplete &&
                          this.options.onExitComplete();
                    this.targetLayout = i;
                  }
                );
          }
          unmount() {
            this.options.layoutId && this.willUpdate(), this.root.nodes.remove(this);
            let t = this.getStack();
            t && t.remove(this),
              this.parent && this.parent.children.delete(this),
              (this.instance = void 0),
              tx(this.updateProjection);
          }
          blockUpdate() {
            this.updateManuallyBlocked = !0;
          }
          unblockUpdate() {
            this.updateManuallyBlocked = !1;
          }
          isUpdateBlocked() {
            return this.updateManuallyBlocked || this.updateBlockedByResize;
          }
          isTreeAnimationBlocked() {
            return (
              this.isAnimationBlocked || (this.parent && this.parent.isTreeAnimationBlocked()) || !1
            );
          }
          startUpdate() {
            !this.isUpdateBlocked() &&
              ((this.isUpdating = !0), this.nodes && this.nodes.forEach(nS), this.animationId++);
          }
          getTransformTemplate() {
            let { visualElement: t } = this.options;
            return t && t.getProps().transformTemplate;
          }
          willUpdate(t = !0) {
            if (((this.root.hasTreeAnimated = !0), this.root.isUpdateBlocked())) {
              this.options.onExitComplete && this.options.onExitComplete();
              return;
            }
            if (
              (window.MotionCancelOptimisedAnimation &&
                !this.hasCheckedOptimisedAppear &&
                (function t(e) {
                  if (((e.hasCheckedOptimisedAppear = !0), e.root === e)) return;
                  let { visualElement: r } = e.options;
                  if (!r) return;
                  let i = r.props[tL];
                  if (window.MotionHasOptimisedAnimation(i, 'transform')) {
                    let { layout: t, layoutId: r } = e.options;
                    window.MotionCancelOptimisedAnimation(i, 'transform', tb, !(t || r));
                  }
                  let { parent: n } = e;
                  n && !n.hasCheckedOptimisedAppear && t(n);
                })(this),
              this.root.isUpdating || this.root.startUpdate(),
              this.isLayoutDirty)
            )
              return;
            this.isLayoutDirty = !0;
            for (let t = 0; t < this.path.length; t++) {
              let e = this.path[t];
              (e.shouldResetTransform = !0),
                e.updateScroll('snapshot'),
                e.options.layoutRoot && e.willUpdate(!1);
            }
            let { layoutId: e, layout: r } = this.options;
            if (void 0 === e && !r) return;
            let i = this.getTransformTemplate();
            (this.prevTransformTemplateValue = i ? i(this.latestValues, '') : void 0),
              this.updateSnapshot(),
              t && this.notifyListeners('willUpdate');
          }
          update() {
            if (((this.updateScheduled = !1), this.isUpdateBlocked())) {
              this.unblockUpdate(), this.clearAllSnapshots(), this.nodes.forEach(nm);
              return;
            }
            this.isUpdating || this.nodes.forEach(ng),
              (this.isUpdating = !1),
              this.nodes.forEach(nv),
              this.nodes.forEach(nc),
              this.nodes.forEach(nd),
              this.clearAllSnapshots();
            let t = tT.now();
            (tS.delta = tq(0, 1e3 / 60, t - tS.timestamp)),
              (tS.timestamp = t),
              (tS.isProcessing = !0),
              tk.update.process(tS),
              tk.preRender.process(tS),
              tk.render.process(tS),
              (tS.isProcessing = !1);
          }
          didUpdate() {
            this.updateScheduled || ((this.updateScheduled = !0), iL.read(this.scheduleUpdate));
          }
          clearAllSnapshots() {
            this.nodes.forEach(nf), this.sharedNodes.forEach(nk);
          }
          scheduleUpdateProjection() {
            this.projectionUpdateScheduled ||
              ((this.projectionUpdateScheduled = !0), tb.preRender(this.updateProjection, !1, !0));
          }
          scheduleCheckAfterUnmount() {
            tb.postRender(() => {
              this.isLayoutDirty ? this.root.didUpdate() : this.root.checkUpdateFailed();
            });
          }
          updateSnapshot() {
            !this.snapshot && this.instance && (this.snapshot = this.measure());
          }
          updateLayout() {
            if (
              !this.instance ||
              (this.updateScroll(),
              !(this.options.alwaysMeasureLayout && this.isLead()) && !this.isLayoutDirty)
            )
              return;
            if (this.resumeFrom && !this.resumeFrom.instance)
              for (let t = 0; t < this.path.length; t++) this.path[t].updateScroll();
            let t = this.layout;
            (this.layout = this.measure(!1)),
              (this.layoutCorrected = il()),
              (this.isLayoutDirty = !1),
              (this.projectionDelta = void 0),
              this.notifyListeners('measure', this.layout.layoutBox);
            let { visualElement: e } = this.options;
            e && e.notify('LayoutMeasure', this.layout.layoutBox, t ? t.layoutBox : void 0);
          }
          updateScroll(t = 'measure') {
            let e = !!(this.options.layoutScroll && this.instance);
            if (
              (this.scroll &&
                this.scroll.animationId === this.root.animationId &&
                this.scroll.phase === t &&
                (e = !1),
              e)
            ) {
              let e = i(this.instance);
              this.scroll = {
                animationId: this.root.animationId,
                phase: t,
                isRoot: e,
                offset: r(this.instance),
                wasRoot: this.scroll ? this.scroll.isRoot : e,
              };
            }
          }
          resetTransform() {
            if (!n) return;
            let t =
                this.isLayoutDirty || this.shouldResetTransform || this.options.alwaysMeasureLayout,
              e = this.projectionDelta && !i9(this.projectionDelta),
              r = this.getTransformTemplate(),
              i = r ? r(this.latestValues, '') : void 0,
              o = i !== this.prevTransformTemplateValue;
            t &&
              (e || ip(this.latestValues) || o) &&
              (n(this.instance, i), (this.shouldResetTransform = !1), this.scheduleRender());
          }
          measure(t = !0) {
            var e;
            let r = this.measurePageBox(),
              i = this.removeElementScroll(r);
            return (
              t && (i = this.removeTransform(i)),
              nR((e = i).x),
              nR(e.y),
              {
                animationId: this.root.animationId,
                measuredBox: r,
                layoutBox: i,
                latestValues: {},
                source: this.id,
              }
            );
          }
          measurePageBox() {
            var t;
            let { visualElement: e } = this.options;
            if (!e) return il();
            let r = e.measureViewportBox();
            if (
              !(
                (null === (t = this.scroll) || void 0 === t ? void 0 : t.wasRoot) ||
                this.path.some(n_)
              )
            ) {
              let { scroll: t } = this.root;
              t && (ib(r.x, t.offset.x), ib(r.y, t.offset.y));
            }
            return r;
          }
          removeElementScroll(t) {
            var e;
            let r = il();
            if ((iJ(r, t), null === (e = this.scroll) || void 0 === e ? void 0 : e.wasRoot))
              return r;
            for (let e = 0; e < this.path.length; e++) {
              let i = this.path[e],
                { scroll: n, options: o } = i;
              i !== this.root &&
                n &&
                o.layoutScroll &&
                (n.wasRoot && iJ(r, t), ib(r.x, n.offset.x), ib(r.y, n.offset.y));
            }
            return r;
          }
          applyTransform(t, e = !1) {
            let r = il();
            iJ(r, t);
            for (let t = 0; t < this.path.length; t++) {
              let i = this.path[t];
              !e &&
                i.options.layoutScroll &&
                i.scroll &&
                i !== i.root &&
                iS(r, { x: -i.scroll.offset.x, y: -i.scroll.offset.y }),
                ip(i.latestValues) && iS(r, i.latestValues);
            }
            return ip(this.latestValues) && iS(r, this.latestValues), r;
          }
          removeTransform(t) {
            let e = il();
            iJ(e, t);
            for (let t = 0; t < this.path.length; t++) {
              let r = this.path[t];
              if (!r.instance || !ip(r.latestValues)) continue;
              ih(r.latestValues) && r.updateSnapshot();
              let i = il();
              iJ(i, r.measurePageBox()),
                i3(e, r.latestValues, r.snapshot ? r.snapshot.layoutBox : void 0, i);
            }
            return ip(this.latestValues) && i3(e, this.latestValues), e;
          }
          setTargetDelta(t) {
            (this.targetDelta = t),
              this.root.scheduleUpdateProjection(),
              (this.isProjectionDirty = !0);
          }
          setOptions(t) {
            this.options = {
              ...this.options,
              ...t,
              crossfade: void 0 === t.crossfade || t.crossfade,
            };
          }
          clearMeasurements() {
            (this.scroll = void 0),
              (this.layout = void 0),
              (this.snapshot = void 0),
              (this.prevTransformTemplateValue = void 0),
              (this.targetDelta = void 0),
              (this.target = void 0),
              (this.isLayoutDirty = !1);
          }
          forceRelativeParentToResolveTarget() {
            this.relativeParent &&
              this.relativeParent.resolvedRelativeTargetAt !== tS.timestamp &&
              this.relativeParent.resolveTargetDelta(!0);
          }
          resolveTargetDelta(t = !1) {
            var e, r, i, n;
            let o = this.getLead();
            this.isProjectionDirty || (this.isProjectionDirty = o.isProjectionDirty),
              this.isTransformDirty || (this.isTransformDirty = o.isTransformDirty),
              this.isSharedProjectionDirty ||
                (this.isSharedProjectionDirty = o.isSharedProjectionDirty);
            let a = !!this.resumingFrom || this !== o;
            if (
              !(
                t ||
                (a && this.isSharedProjectionDirty) ||
                this.isProjectionDirty ||
                (null === (e = this.parent) || void 0 === e ? void 0 : e.isProjectionDirty) ||
                this.attemptToResolveRelativeTarget ||
                this.root.updateBlockedByResize
              )
            )
              return;
            let { layout: s, layoutId: l } = this.options;
            if (this.layout && (s || l)) {
              if (
                ((this.resolvedRelativeTargetAt = tS.timestamp),
                !this.targetDelta && !this.relativeTarget)
              ) {
                let t = this.getClosestProjectingParent();
                t && t.layout && 1 !== this.animationProgress
                  ? ((this.relativeParent = t),
                    this.forceRelativeParentToResolveTarget(),
                    (this.relativeTarget = il()),
                    (this.relativeTargetOrigin = il()),
                    r7(this.relativeTargetOrigin, this.layout.layoutBox, t.layout.layoutBox),
                    iJ(this.relativeTarget, this.relativeTargetOrigin))
                  : (this.relativeParent = this.relativeTarget = void 0);
              }
              if (this.relativeTarget || this.targetDelta) {
                if (
                  ((this.target || ((this.target = il()), (this.targetWithTransforms = il())),
                  this.relativeTarget &&
                    this.relativeTargetOrigin &&
                    this.relativeParent &&
                    this.relativeParent.target)
                    ? (this.forceRelativeParentToResolveTarget(),
                      (r = this.target),
                      (i = this.relativeTarget),
                      (n = this.relativeParent.target),
                      r6(r.x, i.x, n.x),
                      r6(r.y, i.y, n.y))
                    : this.targetDelta
                      ? (this.resumingFrom
                          ? (this.target = this.applyTransform(this.layout.layoutBox))
                          : iJ(this.target, this.layout.layoutBox),
                        iy(this.target, this.targetDelta))
                      : iJ(this.target, this.layout.layoutBox),
                  this.attemptToResolveRelativeTarget)
                ) {
                  this.attemptToResolveRelativeTarget = !1;
                  let t = this.getClosestProjectingParent();
                  t &&
                  !!t.resumingFrom == !!this.resumingFrom &&
                  !t.options.layoutScroll &&
                  t.target &&
                  1 !== this.animationProgress
                    ? ((this.relativeParent = t),
                      this.forceRelativeParentToResolveTarget(),
                      (this.relativeTarget = il()),
                      (this.relativeTargetOrigin = il()),
                      r7(this.relativeTargetOrigin, this.target, t.target),
                      iJ(this.relativeTarget, this.relativeTargetOrigin))
                    : (this.relativeParent = this.relativeTarget = void 0);
                }
                nn && ni.resolvedTargetDeltas++;
              }
            }
          }
          getClosestProjectingParent() {
            return !this.parent || ih(this.parent.latestValues) || im(this.parent.latestValues)
              ? void 0
              : this.parent.isProjecting()
                ? this.parent
                : this.parent.getClosestProjectingParent();
          }
          isProjecting() {
            return !!(
              (this.relativeTarget || this.targetDelta || this.options.layoutRoot) &&
              this.layout
            );
          }
          calcProjection() {
            var t;
            let e = this.getLead(),
              r = !!this.resumingFrom || this !== e,
              i = !0;
            if (
              ((this.isProjectionDirty ||
                (null === (t = this.parent) || void 0 === t ? void 0 : t.isProjectionDirty)) &&
                (i = !1),
              r && (this.isSharedProjectionDirty || this.isTransformDirty) && (i = !1),
              this.resolvedRelativeTargetAt === tS.timestamp && (i = !1),
              i)
            )
              return;
            let { layout: n, layoutId: o } = this.options;
            if (
              ((this.isTreeAnimating = !!(
                (this.parent && this.parent.isTreeAnimating) ||
                this.currentAnimation ||
                this.pendingAnimation
              )),
              this.isTreeAnimating || (this.targetDelta = this.relativeTarget = void 0),
              !this.layout || !(n || o))
            )
              return;
            iJ(this.layoutCorrected, this.layout.layoutBox);
            let a = this.treeScale.x,
              s = this.treeScale.y;
            !(function (t, e, r, i = !1) {
              let n, o;
              let a = r.length;
              if (a) {
                e.x = e.y = 1;
                for (let s = 0; s < a; s++) {
                  o = (n = r[s]).projectionDelta;
                  let { visualElement: a } = n.options;
                  (!a || !a.props.style || 'contents' !== a.props.style.display) &&
                    (i &&
                      n.options.layoutScroll &&
                      n.scroll &&
                      n !== n.root &&
                      iS(t, { x: -n.scroll.offset.x, y: -n.scroll.offset.y }),
                    o && ((e.x *= o.x.scale), (e.y *= o.y.scale), iy(t, o)),
                    i && ip(n.latestValues) && iS(t, n.latestValues));
                }
                e.x < 1.0000000000001 && e.x > 0.999999999999 && (e.x = 1),
                  e.y < 1.0000000000001 && e.y > 0.999999999999 && (e.y = 1);
              }
            })(this.layoutCorrected, this.treeScale, this.path, r),
              e.layout &&
                !e.target &&
                (1 !== this.treeScale.x || 1 !== this.treeScale.y) &&
                ((e.target = e.layout.layoutBox), (e.targetWithTransforms = il()));
            let { target: l } = e;
            if (!l) {
              this.prevProjectionDelta && (this.createProjectionDeltas(), this.scheduleRender());
              return;
            }
            this.projectionDelta && this.prevProjectionDelta
              ? (iQ(this.prevProjectionDelta.x, this.projectionDelta.x),
                iQ(this.prevProjectionDelta.y, this.projectionDelta.y))
              : this.createProjectionDeltas(),
              r9(this.projectionDelta, this.layoutCorrected, l, this.latestValues),
              (this.treeScale.x === a &&
                this.treeScale.y === s &&
                ne(this.projectionDelta.x, this.prevProjectionDelta.x) &&
                ne(this.projectionDelta.y, this.prevProjectionDelta.y)) ||
                ((this.hasProjected = !0),
                this.scheduleRender(),
                this.notifyListeners('projectionUpdate', l)),
              nn && ni.recalculatedProjection++;
          }
          hide() {
            this.isVisible = !1;
          }
          show() {
            this.isVisible = !0;
          }
          scheduleRender(t = !0) {
            var e;
            if (
              (null === (e = this.options.visualElement) || void 0 === e || e.scheduleRender(), t)
            ) {
              let t = this.getStack();
              t && t.scheduleRender();
            }
            this.resumingFrom && !this.resumingFrom.instance && (this.resumingFrom = void 0);
          }
          createProjectionDeltas() {
            (this.prevProjectionDelta = ia()),
              (this.projectionDelta = ia()),
              (this.projectionDeltaWithTransform = ia());
          }
          setAnimationOrigin(t, e = !1) {
            let r;
            let i = this.snapshot,
              n = i ? i.latestValues : {},
              o = { ...this.latestValues },
              a = ia();
            (this.relativeParent && this.relativeParent.options.layoutRoot) ||
              (this.relativeTarget = this.relativeTargetOrigin = void 0),
              (this.attemptToResolveRelativeTarget = !e);
            let s = il(),
              l = (i ? i.source : void 0) !== (this.layout ? this.layout.source : void 0),
              u = this.getStack(),
              c = !u || u.members.length <= 1,
              d = !!(l && !c && !0 === this.options.crossfade && !this.path.some(nP));
            (this.animationProgress = 0),
              (this.mixTargetDelta = (e) => {
                let i = e / 1e3;
                if (
                  (nw(a.x, t.x, i),
                  nw(a.y, t.y, i),
                  this.setTargetDelta(a),
                  this.relativeTarget &&
                    this.relativeTargetOrigin &&
                    this.layout &&
                    this.relativeParent &&
                    this.relativeParent.layout)
                ) {
                  var u, h, p, f;
                  r7(s, this.layout.layoutBox, this.relativeParent.layout.layoutBox),
                    (p = this.relativeTarget),
                    (f = this.relativeTargetOrigin),
                    nT(p.x, f.x, s.x, i),
                    nT(p.y, f.y, s.y, i),
                    r &&
                      ((u = this.relativeTarget), (h = r), i6(u.x, h.x) && i6(u.y, h.y)) &&
                      (this.isProjectionDirty = !1),
                    r || (r = il()),
                    iJ(r, this.relativeTarget);
                }
                l &&
                  ((this.animationValues = o),
                  (function (t, e, r, i, n, o) {
                    n
                      ? ((t.opacity = eQ(0, void 0 !== r.opacity ? r.opacity : 1, iG(i))),
                        (t.opacityExit = eQ(void 0 !== e.opacity ? e.opacity : 1, 0, iq(i))))
                      : o &&
                        (t.opacity = eQ(
                          void 0 !== e.opacity ? e.opacity : 1,
                          void 0 !== r.opacity ? r.opacity : 1,
                          i
                        ));
                    for (let n = 0; n < iU; n++) {
                      let o = `border${iN[n]}Radius`,
                        a = iX(e, o),
                        s = iX(r, o);
                      (void 0 !== a || void 0 !== s) &&
                        (a || (a = 0),
                        s || (s = 0),
                        0 === a || 0 === s || iY(a) === iY(s)
                          ? ((t[o] = Math.max(eQ(iH(a), iH(s), i), 0)),
                            (et.test(s) || et.test(a)) && (t[o] += '%'))
                          : (t[o] = s));
                    }
                    (e.rotate || r.rotate) && (t.rotate = eQ(e.rotate || 0, r.rotate || 0, i));
                  })(o, n, this.latestValues, i, d, c)),
                  this.root.scheduleUpdateProjection(),
                  this.scheduleRender(),
                  (this.animationProgress = i);
              }),
              this.mixTargetDelta(this.options.layoutRoot ? 1e3 : 0);
          }
          startAnimation(t) {
            this.notifyListeners('animationStart'),
              this.currentAnimation && this.currentAnimation.stop(),
              this.resumingFrom &&
                this.resumingFrom.currentAnimation &&
                this.resumingFrom.currentAnimation.stop(),
              this.pendingAnimation &&
                (tx(this.pendingAnimation), (this.pendingAnimation = void 0)),
              (this.pendingAnimation = tb.update(() => {
                (i_.hasAnimatedSinceResize = !0),
                  (this.currentAnimation = (function (t, e, r) {
                    let i = tM(0) ? 0 : t_(0);
                    return i.start(rD('', i, 1e3, r)), i.animation;
                  })(0, 0, {
                    ...t,
                    onUpdate: (e) => {
                      this.mixTargetDelta(e), t.onUpdate && t.onUpdate(e);
                    },
                    onComplete: () => {
                      t.onComplete && t.onComplete(), this.completeAnimation();
                    },
                  })),
                  this.resumingFrom && (this.resumingFrom.currentAnimation = this.currentAnimation),
                  (this.pendingAnimation = void 0);
              }));
          }
          completeAnimation() {
            this.resumingFrom &&
              ((this.resumingFrom.currentAnimation = void 0),
              (this.resumingFrom.preserveOpacity = void 0));
            let t = this.getStack();
            t && t.exitAnimationComplete(),
              (this.resumingFrom = this.currentAnimation = this.animationValues = void 0),
              this.notifyListeners('animationComplete');
          }
          finishAnimation() {
            this.currentAnimation &&
              (this.mixTargetDelta && this.mixTargetDelta(1e3), this.currentAnimation.stop()),
              this.completeAnimation();
          }
          applyTransformsToTarget() {
            let t = this.getLead(),
              { targetWithTransforms: e, target: r, layout: i, latestValues: n } = t;
            if (e && r && i) {
              if (
                this !== t &&
                this.layout &&
                i &&
                nj(this.options.animationType, this.layout.layoutBox, i.layoutBox)
              ) {
                r = this.target || il();
                let e = r3(this.layout.layoutBox.x);
                (r.x.min = t.target.x.min), (r.x.max = r.x.min + e);
                let i = r3(this.layout.layoutBox.y);
                (r.y.min = t.target.y.min), (r.y.max = r.y.min + i);
              }
              iJ(e, r), iS(e, n), r9(this.projectionDeltaWithTransform, this.layoutCorrected, e, n);
            }
          }
          registerSharedNode(t, e) {
            this.sharedNodes.has(t) || this.sharedNodes.set(t, new nr()),
              this.sharedNodes.get(t).add(e);
            let r = e.options.initialPromotionConfig;
            e.promote({
              transition: r ? r.transition : void 0,
              preserveFollowOpacity:
                r && r.shouldPreserveFollowOpacity ? r.shouldPreserveFollowOpacity(e) : void 0,
            });
          }
          isLead() {
            let t = this.getStack();
            return !t || t.lead === this;
          }
          getLead() {
            var t;
            let { layoutId: e } = this.options;
            return (
              (e && (null === (t = this.getStack()) || void 0 === t ? void 0 : t.lead)) || this
            );
          }
          getPrevLead() {
            var t;
            let { layoutId: e } = this.options;
            return e
              ? null === (t = this.getStack()) || void 0 === t
                ? void 0
                : t.prevLead
              : void 0;
          }
          getStack() {
            let { layoutId: t } = this.options;
            if (t) return this.root.sharedNodes.get(t);
          }
          promote({ needsReset: t, transition: e, preserveFollowOpacity: r } = {}) {
            let i = this.getStack();
            i && i.promote(this, r),
              t && ((this.projectionDelta = void 0), (this.needsReset = !0)),
              e && this.setOptions({ transition: e });
          }
          relegate() {
            let t = this.getStack();
            return !!t && t.relegate(this);
          }
          resetSkewAndRotation() {
            let { visualElement: t } = this.options;
            if (!t) return;
            let e = !1,
              { latestValues: r } = t;
            if (
              ((r.z || r.rotate || r.rotateX || r.rotateY || r.rotateZ || r.skewX || r.skewY) &&
                (e = !0),
              !e)
            )
              return;
            let i = {};
            r.z && nl('z', t, i, this.animationValues);
            for (let e = 0; e < no.length; e++)
              nl(`rotate${no[e]}`, t, i, this.animationValues),
                nl(`skew${no[e]}`, t, i, this.animationValues);
            for (let e in (t.render(), i))
              t.setStaticValue(e, i[e]), this.animationValues && (this.animationValues[e] = i[e]);
            t.scheduleRender();
          }
          getProjectionStyles(t) {
            var e, r;
            if (!this.instance || this.isSVG) return;
            if (!this.isVisible) return na;
            let i = { visibility: '' },
              n = this.getTransformTemplate();
            if (this.needsReset)
              return (
                (this.needsReset = !1),
                (i.opacity = ''),
                (i.pointerEvents = iW(null == t ? void 0 : t.pointerEvents) || ''),
                (i.transform = n ? n(this.latestValues, '') : 'none'),
                i
              );
            let o = this.getLead();
            if (!this.projectionDelta || !this.layout || !o.target) {
              let e = {};
              return (
                this.options.layoutId &&
                  ((e.opacity =
                    void 0 !== this.latestValues.opacity ? this.latestValues.opacity : 1),
                  (e.pointerEvents = iW(null == t ? void 0 : t.pointerEvents) || '')),
                this.hasProjected &&
                  !ip(this.latestValues) &&
                  ((e.transform = n ? n({}, '') : 'none'), (this.hasProjected = !1)),
                e
              );
            }
            let a = o.animationValues || o.latestValues;
            this.applyTransformsToTarget(),
              (i.transform = (function (t, e, r) {
                let i = '',
                  n = t.x.translate / e.x,
                  o = t.y.translate / e.y,
                  a = (null == r ? void 0 : r.z) || 0;
                if (
                  ((n || o || a) && (i = `translate3d(${n}px, ${o}px, ${a}px) `),
                  (1 !== e.x || 1 !== e.y) && (i += `scale(${1 / e.x}, ${1 / e.y}) `),
                  r)
                ) {
                  let {
                    transformPerspective: t,
                    rotate: e,
                    rotateX: n,
                    rotateY: o,
                    skewX: a,
                    skewY: s,
                  } = r;
                  t && (i = `perspective(${t}px) ${i}`),
                    e && (i += `rotate(${e}deg) `),
                    n && (i += `rotateX(${n}deg) `),
                    o && (i += `rotateY(${o}deg) `),
                    a && (i += `skewX(${a}deg) `),
                    s && (i += `skewY(${s}deg) `);
                }
                let s = t.x.scale * e.x,
                  l = t.y.scale * e.y;
                return (1 !== s || 1 !== l) && (i += `scale(${s}, ${l})`), i || 'none';
              })(this.projectionDeltaWithTransform, this.treeScale, a)),
              n && (i.transform = n(a, i.transform));
            let { x: s, y: l } = this.projectionDelta;
            for (let t in ((i.transformOrigin = `${100 * s.origin}% ${100 * l.origin}% 0`),
            o.animationValues
              ? (i.opacity =
                  o === this
                    ? null !==
                        (r =
                          null !== (e = a.opacity) && void 0 !== e
                            ? e
                            : this.latestValues.opacity) && void 0 !== r
                      ? r
                      : 1
                    : this.preserveOpacity
                      ? this.latestValues.opacity
                      : a.opacityExit)
              : (i.opacity =
                  o === this
                    ? void 0 !== a.opacity
                      ? a.opacity
                      : ''
                    : void 0 !== a.opacityExit
                      ? a.opacityExit
                      : 0),
            iD)) {
              if (void 0 === a[t]) continue;
              let { correct: e, applyTo: r } = iD[t],
                n = 'none' === i.transform ? a[t] : e(a[t], o);
              if (r) {
                let t = r.length;
                for (let e = 0; e < t; e++) i[r[e]] = n;
              } else i[t] = n;
            }
            return (
              this.options.layoutId &&
                (i.pointerEvents =
                  o === this ? iW(null == t ? void 0 : t.pointerEvents) || '' : 'none'),
              i
            );
          }
          clearSnapshot() {
            this.resumeFrom = this.snapshot = void 0;
          }
          resetTree() {
            this.root.nodes.forEach((t) => {
              var e;
              return null === (e = t.currentAnimation) || void 0 === e ? void 0 : e.stop();
            }),
              this.root.nodes.forEach(nm),
              this.root.sharedNodes.clear();
          }
        };
      }
      function nc(t) {
        t.updateLayout();
      }
      function nd(t) {
        var e;
        let r = (null === (e = t.resumeFrom) || void 0 === e ? void 0 : e.snapshot) || t.snapshot;
        if (t.isLead() && t.layout && r && t.hasListeners('didUpdate')) {
          let { layoutBox: e, measuredBox: i } = t.layout,
            { animationType: n } = t.options,
            o = r.source !== t.layout.source;
          'size' === n
            ? iu((t) => {
                let i = o ? r.measuredBox[t] : r.layoutBox[t],
                  n = r3(i);
                (i.min = e[t].min), (i.max = i.min + n);
              })
            : nj(n, r.layoutBox, e) &&
              iu((i) => {
                let n = o ? r.measuredBox[i] : r.layoutBox[i],
                  a = r3(e[i]);
                (n.max = n.min + a),
                  t.relativeTarget &&
                    !t.currentAnimation &&
                    ((t.isProjectionDirty = !0),
                    (t.relativeTarget[i].max = t.relativeTarget[i].min + a));
              });
          let a = ia();
          r9(a, e, r.layoutBox);
          let s = ia();
          o ? r9(s, t.applyTransform(i, !0), r.measuredBox) : r9(s, e, r.layoutBox);
          let l = !i9(a),
            u = !1;
          if (!t.resumeFrom) {
            let i = t.getClosestProjectingParent();
            if (i && !i.resumeFrom) {
              let { snapshot: n, layout: o } = i;
              if (n && o) {
                let a = il();
                r7(a, r.layoutBox, n.layoutBox);
                let s = il();
                r7(s, e, o.layoutBox),
                  i7(a, s) || (u = !0),
                  i.options.layoutRoot &&
                    ((t.relativeTarget = s), (t.relativeTargetOrigin = a), (t.relativeParent = i));
              }
            }
          }
          t.notifyListeners('didUpdate', {
            layout: e,
            snapshot: r,
            delta: s,
            layoutDelta: a,
            hasLayoutChanged: l,
            hasRelativeTargetChanged: u,
          });
        } else if (t.isLead()) {
          let { onExitComplete: e } = t.options;
          e && e();
        }
        t.options.transition = void 0;
      }
      function nh(t) {
        nn && ni.totalNodes++,
          t.parent &&
            (t.isProjecting() || (t.isProjectionDirty = t.parent.isProjectionDirty),
            t.isSharedProjectionDirty ||
              (t.isSharedProjectionDirty = !!(
                t.isProjectionDirty ||
                t.parent.isProjectionDirty ||
                t.parent.isSharedProjectionDirty
              )),
            t.isTransformDirty || (t.isTransformDirty = t.parent.isTransformDirty));
      }
      function np(t) {
        t.isProjectionDirty = t.isSharedProjectionDirty = t.isTransformDirty = !1;
      }
      function nf(t) {
        t.clearSnapshot();
      }
      function nm(t) {
        t.clearMeasurements();
      }
      function ng(t) {
        t.isLayoutDirty = !1;
      }
      function nv(t) {
        let { visualElement: e } = t.options;
        e && e.getProps().onBeforeLayoutMeasure && e.notify('BeforeLayoutMeasure'),
          t.resetTransform();
      }
      function ny(t) {
        t.finishAnimation(),
          (t.targetDelta = t.relativeTarget = t.target = void 0),
          (t.isProjectionDirty = !0);
      }
      function nb(t) {
        t.resolveTargetDelta();
      }
      function nx(t) {
        t.calcProjection();
      }
      function nS(t) {
        t.resetSkewAndRotation();
      }
      function nk(t) {
        t.removeLeadSnapshot();
      }
      function nw(t, e, r) {
        (t.translate = eQ(e.translate, 0, r)),
          (t.scale = eQ(e.scale, 1, r)),
          (t.origin = e.origin),
          (t.originPoint = e.originPoint);
      }
      function nT(t, e, r, i) {
        (t.min = eQ(e.min, r.min, i)), (t.max = eQ(e.max, r.max, i));
      }
      function nP(t) {
        return t.animationValues && void 0 !== t.animationValues.opacityExit;
      }
      let nA = { duration: 0.45, ease: [0.4, 0, 0.1, 1] },
        nC = (t) =>
          'undefined' != typeof navigator &&
          navigator.userAgent &&
          navigator.userAgent.toLowerCase().includes(t),
        nE = nC('applewebkit/') && !nC('chrome/') ? Math.round : tc;
      function nR(t) {
        (t.min = nE(t.min)), (t.max = nE(t.max));
      }
      function nj(t, e, r) {
        return 'position' === t || ('preserve-aspect' === t && !(0.2 >= Math.abs(nt(e) - nt(r))));
      }
      function n_(t) {
        var e;
        return t !== t.root && (null === (e = t.scroll) || void 0 === e ? void 0 : e.wasRoot);
      }
      let nM = nu({
          attachResizeListener: (t, e) => rX(t, 'resize', e),
          measureScroll: () => ({
            x: document.documentElement.scrollLeft || document.body.scrollLeft,
            y: document.documentElement.scrollTop || document.body.scrollTop,
          }),
          checkIsScrollRoot: () => !0,
        }),
        nB = { current: void 0 },
        nD = nu({
          measureScroll: (t) => ({ x: t.scrollLeft, y: t.scrollTop }),
          defaultParent: () => {
            if (!nB.current) {
              let t = new nM({});
              t.mount(window), t.setOptions({ layoutScroll: !0 }), (nB.current = t);
            }
            return nB.current;
          },
          resetTransform: (t, e) => {
            t.style.transform = void 0 !== e ? e : 'none';
          },
          checkIsScrollRoot: (t) => 'fixed' === window.getComputedStyle(t).position,
        });
      function nL(t, e, r) {
        let { props: i } = t;
        t.animationState && i.whileHover && t.animationState.setActive('whileHover', 'Start' === r);
        let n = i['onHover' + r];
        n && tb.postRender(() => n(e, rG(e)));
      }
      class nO extends rN {
        mount() {
          let { current: t } = this.node;
          t &&
            (this.unmount = (function (t, e, r = {}) {
              let [i, n, o] = J(t, r),
                a = Q((t) => {
                  let { target: r } = t,
                    i = e(t);
                  if ('function' != typeof i || !r) return;
                  let o = Q((t) => {
                    i(t), r.removeEventListener('pointerleave', o);
                  });
                  r.addEventListener('pointerleave', o, n);
                });
              return (
                i.forEach((t) => {
                  t.addEventListener('pointerenter', a, n);
                }),
                o
              );
            })(t, (t) => (nL(this.node, t, 'Start'), (t) => nL(this.node, t, 'End'))));
        }
        unmount() {}
      }
      class nV extends rN {
        constructor() {
          super(...arguments), (this.isActive = !1);
        }
        onFocus() {
          let t = !1;
          try {
            t = this.node.current.matches(':focus-visible');
          } catch (e) {
            t = !0;
          }
          t &&
            this.node.animationState &&
            (this.node.animationState.setActive('whileFocus', !0), (this.isActive = !0));
        }
        onBlur() {
          this.isActive &&
            this.node.animationState &&
            (this.node.animationState.setActive('whileFocus', !1), (this.isActive = !1));
        }
        mount() {
          this.unmount = e8(
            rX(this.node.current, 'focus', () => this.onFocus()),
            rX(this.node.current, 'blur', () => this.onBlur())
          );
        }
        unmount() {}
      }
      function nI(t, e, r) {
        let { props: i } = t;
        t.animationState && i.whileTap && t.animationState.setActive('whileTap', 'Start' === r);
        let n = i['onTap' + ('End' === r ? '' : r)];
        n && tb.postRender(() => n(e, rG(e)));
      }
      class n$ extends rN {
        mount() {
          let { current: t } = this.node;
          t &&
            (this.unmount = (function (t, e, r = {}) {
              let [i, n, o] = J(t, r),
                a = (t) => {
                  let i = t.currentTarget;
                  if (!ts(t) || ti.has(i)) return;
                  ti.add(i);
                  let o = e(t),
                    a = (t, e) => {
                      window.removeEventListener('pointerup', s),
                        window.removeEventListener('pointercancel', l),
                        ts(t) &&
                          ti.has(i) &&
                          (ti.delete(i), 'function' == typeof o && o(t, { success: e }));
                    },
                    s = (t) => {
                      a(t, r.useGlobalTarget || tt(i, t.target));
                    },
                    l = (t) => {
                      a(t, !1);
                    };
                  window.addEventListener('pointerup', s, n),
                    window.addEventListener('pointercancel', l, n);
                };
              return (
                i.forEach((t) => {
                  tr.has(t.tagName) ||
                    -1 !== t.tabIndex ||
                    null !== t.getAttribute('tabindex') ||
                    (t.tabIndex = 0),
                    (r.useGlobalTarget ? window : t).addEventListener('pointerdown', a, n),
                    t.addEventListener('focus', (t) => ta(t, n), n);
                }),
                o
              );
            })(
              t,
              (t) => (
                nI(this.node, t, 'Start'),
                (t, { success: e }) => nI(this.node, t, e ? 'End' : 'Cancel')
              ),
              { useGlobalTarget: this.node.props.globalTapTarget }
            ));
        }
        unmount() {}
      }
      let nF = new WeakMap(),
        nz = new WeakMap(),
        nW = (t) => {
          let e = nF.get(t.target);
          e && e(t);
        },
        nN = (t) => {
          t.forEach(nW);
        },
        nU = { some: 0, all: 1 };
      class nH extends rN {
        constructor() {
          super(...arguments), (this.hasEnteredView = !1), (this.isInView = !1);
        }
        startObserver() {
          this.unmount();
          let { viewport: t = {} } = this.node.getProps(),
            { root: e, margin: r, amount: i = 'some', once: n } = t,
            o = {
              root: e ? e.current : void 0,
              rootMargin: r,
              threshold: 'number' == typeof i ? i : nU[i],
            };
          return (function (t, e, r) {
            let i = (function ({ root: t, ...e }) {
              let r = t || document;
              nz.has(r) || nz.set(r, {});
              let i = nz.get(r),
                n = JSON.stringify(e);
              return i[n] || (i[n] = new IntersectionObserver(nN, { root: t, ...e })), i[n];
            })(e);
            return (
              nF.set(t, r),
              i.observe(t),
              () => {
                nF.delete(t), i.unobserve(t);
              }
            );
          })(this.node.current, o, (t) => {
            let { isIntersecting: e } = t;
            if (this.isInView === e || ((this.isInView = e), n && !e && this.hasEnteredView))
              return;
            e && (this.hasEnteredView = !0),
              this.node.animationState && this.node.animationState.setActive('whileInView', e);
            let { onViewportEnter: r, onViewportLeave: i } = this.node.getProps(),
              o = e ? r : i;
            o && o(t);
          });
        }
        mount() {
          this.startObserver();
        }
        update() {
          if ('undefined' == typeof IntersectionObserver) return;
          let { props: t, prevProps: e } = this.node;
          ['amount', 'margin', 'root'].some(
            (function ({ viewport: t = {} }, { viewport: e = {} } = {}) {
              return (r) => t[r] !== e[r];
            })(t, e)
          ) && this.startObserver();
        }
        unmount() {}
      }
      let nY = (0, c.createContext)({ strict: !1 }),
        nX = (0, c.createContext)({});
      function nG(t) {
        return C(t.animate) || L.some((e) => j(t[e]));
      }
      function nq(t) {
        return !!(nG(t) || t.variants);
      }
      function nK(t) {
        return Array.isArray(t) ? t.join(' ') : t;
      }
      let nZ = {
          animation: [
            'animate',
            'variants',
            'whileHover',
            'whileTap',
            'exit',
            'whileInView',
            'whileFocus',
            'whileDrag',
          ],
          exit: ['exit'],
          drag: ['drag', 'dragControls'],
          focus: ['whileFocus'],
          hover: ['whileHover', 'onHoverStart', 'onHoverEnd'],
          tap: ['whileTap', 'onTap', 'onTapStart', 'onTapCancel'],
          pan: ['onPan', 'onPanStart', 'onPanSessionStart', 'onPanEnd'],
          inView: ['whileInView', 'onViewportEnter', 'onViewportLeave'],
          layout: ['layout', 'layoutId'],
        },
        nJ = {};
      for (let t in nZ) nJ[t] = { isEnabled: (e) => nZ[t].some((t) => !!e[t]) };
      let nQ = Symbol.for('motionComponentSymbol'),
        n0 = [
          'animate',
          'circle',
          'defs',
          'desc',
          'ellipse',
          'g',
          'image',
          'line',
          'filter',
          'marker',
          'mask',
          'metadata',
          'path',
          'pattern',
          'polygon',
          'polyline',
          'rect',
          'stop',
          'switch',
          'symbol',
          'svg',
          'text',
          'tspan',
          'use',
          'view',
        ];
      function n1(t) {
        if ('string' != typeof t || t.includes('-'));
        else if (n0.indexOf(t) > -1 || /[A-Z]/u.test(t)) return !0;
        return !1;
      }
      let n5 = (t) => (e, r) => {
          let i = (0, c.useContext)(nX),
            n = (0, c.useContext)(p),
            o = () =>
              (function (
                { scrapeMotionValuesFromProps: t, createRenderState: e, onUpdate: r },
                i,
                n,
                o
              ) {
                let a = {
                  latestValues: (function (t, e, r, i) {
                    let n = {},
                      o = i(t, {});
                    for (let t in o) n[t] = iW(o[t]);
                    let { initial: a, animate: s } = t,
                      l = nG(t),
                      u = nq(t);
                    e &&
                      u &&
                      !l &&
                      !1 !== t.inherit &&
                      (void 0 === a && (a = e.initial), void 0 === s && (s = e.animate));
                    let c = !!r && !1 === r.initial,
                      d = (c = c || !1 === a) ? s : a;
                    if (d && 'boolean' != typeof d && !C(d)) {
                      let e = Array.isArray(d) ? d : [d];
                      for (let r = 0; r < e.length; r++) {
                        let i = M(t, e[r]);
                        if (i) {
                          let { transitionEnd: t, transition: e, ...r } = i;
                          for (let t in r) {
                            let e = r[t];
                            if (Array.isArray(e)) {
                              let t = c ? e.length - 1 : 0;
                              e = e[t];
                            }
                            null !== e && (n[t] = e);
                          }
                          for (let e in t) n[e] = t[e];
                        }
                      }
                    }
                    return n;
                  })(i, n, o, t),
                  renderState: e(),
                };
                return (
                  r &&
                    ((a.onMount = (t) => r({ props: i, current: t, ...a })),
                    (a.onUpdate = (t) => r(t))),
                  a
                );
              })(t, e, i, n);
          return r ? o() : h(o);
        },
        n2 = (t, e) => (e && 'number' == typeof t ? e.transform(t) : t),
        n3 = {
          x: 'translateX',
          y: 'translateY',
          z: 'translateZ',
          transformPerspective: 'perspective',
        },
        n4 = td.length;
      function n9(t, e, r) {
        let { style: i, vars: n, transformOrigin: o } = t,
          a = !1,
          s = !1;
        for (let t in e) {
          let r = e[t];
          if (th.has(t)) {
            a = !0;
            continue;
          }
          if (eF(t)) {
            n[t] = r;
            continue;
          }
          {
            let e = n2(r, eS[t]);
            t.startsWith('origin') ? ((s = !0), (o[t] = e)) : (i[t] = e);
          }
        }
        if (
          (!e.transform &&
            (a || r
              ? (i.transform = (function (t, e, r) {
                  let i = '',
                    n = !0;
                  for (let o = 0; o < n4; o++) {
                    let a = td[o],
                      s = t[a];
                    if (void 0 === s) continue;
                    let l = !0;
                    if (
                      !(l =
                        'number' == typeof s
                          ? s === (a.startsWith('scale') ? 1 : 0)
                          : 0 === parseFloat(s)) ||
                      r
                    ) {
                      let t = n2(s, eS[a]);
                      if (!l) {
                        n = !1;
                        let e = n3[a] || a;
                        i += `${e}(${t}) `;
                      }
                      r && (e[a] = t);
                    }
                  }
                  return (i = i.trim()), r ? (i = r(e, n ? '' : i)) : n && (i = 'none'), i;
                })(e, t.transform, r))
              : i.transform && (i.transform = 'none')),
          s)
        ) {
          let { originX: t = '50%', originY: e = '50%', originZ: r = 0 } = o;
          i.transformOrigin = `${t} ${e} ${r}`;
        }
      }
      let n6 = { offset: 'stroke-dashoffset', array: 'stroke-dasharray' },
        n8 = { offset: 'strokeDashoffset', array: 'strokeDasharray' };
      function n7(t, e, r) {
        return 'string' == typeof t ? t : ee.transform(e + r * t);
      }
      function ot(
        t,
        {
          attrX: e,
          attrY: r,
          attrScale: i,
          originX: n,
          originY: o,
          pathLength: a,
          pathSpacing: s = 1,
          pathOffset: l = 0,
          ...u
        },
        c,
        d
      ) {
        if ((n9(t, u, d), c)) {
          t.style.viewBox && (t.attrs.viewBox = t.style.viewBox);
          return;
        }
        (t.attrs = t.style), (t.style = {});
        let { attrs: h, style: p, dimensions: f } = t;
        h.transform && (f && (p.transform = h.transform), delete h.transform),
          f &&
            (void 0 !== n || void 0 !== o || p.transform) &&
            (p.transformOrigin = (function (t, e, r) {
              let i = n7(e, t.x, t.width),
                n = n7(r, t.y, t.height);
              return `${i} ${n}`;
            })(f, void 0 !== n ? n : 0.5, void 0 !== o ? o : 0.5)),
          void 0 !== e && (h.x = e),
          void 0 !== r && (h.y = r),
          void 0 !== i && (h.scale = i),
          void 0 !== a &&
            (function (t, e, r = 1, i = 0, n = !0) {
              t.pathLength = 1;
              let o = n ? n6 : n8;
              t[o.offset] = ee.transform(-i);
              let a = ee.transform(e),
                s = ee.transform(r);
              t[o.array] = `${a} ${s}`;
            })(h, a, s, l, !1);
      }
      let oe = () => ({ style: {}, transform: {}, transformOrigin: {}, vars: {} }),
        or = () => ({ ...oe(), attrs: {} }),
        oi = (t) => 'string' == typeof t && 'svg' === t.toLowerCase();
      function on(t, { style: e, vars: r }, i, n) {
        for (let o in (Object.assign(t.style, e, n && n.getProjectionStyles(i)), r))
          t.style.setProperty(o, r[o]);
      }
      let oo = new Set([
        'baseFrequency',
        'diffuseConstant',
        'kernelMatrix',
        'kernelUnitLength',
        'keySplines',
        'keyTimes',
        'limitingConeAngle',
        'markerHeight',
        'markerWidth',
        'numOctaves',
        'targetX',
        'targetY',
        'surfaceScale',
        'specularConstant',
        'specularExponent',
        'stdDeviation',
        'tableValues',
        'viewBox',
        'gradientTransform',
        'pathLength',
        'startOffset',
        'textLength',
        'lengthAdjust',
      ]);
      function oa(t, e, r, i) {
        for (let r in (on(t, e, void 0, i), e.attrs))
          t.setAttribute(oo.has(r) ? r : tD(r), e.attrs[r]);
      }
      function os(t, { layout: e, layoutId: r }) {
        return (
          th.has(t) ||
          t.startsWith('origin') ||
          ((e || void 0 !== r) && (!!iD[t] || 'opacity' === t))
        );
      }
      function ol(t, e, r) {
        var i;
        let { style: n } = t,
          o = {};
        for (let a in n)
          (tM(n[a]) ||
            (e.style && tM(e.style[a])) ||
            os(a, t) ||
            (null === (i = null == r ? void 0 : r.getValue(a)) || void 0 === i
              ? void 0
              : i.liveStyle) !== void 0) &&
            (o[a] = n[a]);
        return o;
      }
      function ou(t, e, r) {
        let i = ol(t, e, r);
        for (let r in t)
          (tM(t[r]) || tM(e[r])) &&
            (i[-1 !== td.indexOf(r) ? 'attr' + r.charAt(0).toUpperCase() + r.substring(1) : r] =
              t[r]);
        return i;
      }
      let oc = ['x', 'y', 'width', 'height', 'cx', 'cy', 'r'],
        od = {
          useVisualState: n5({
            scrapeMotionValuesFromProps: ou,
            createRenderState: or,
            onUpdate: ({ props: t, prevProps: e, current: r, renderState: i, latestValues: n }) => {
              if (!r) return;
              let o = !!t.drag;
              if (!o) {
                for (let t in n)
                  if (th.has(t)) {
                    o = !0;
                    break;
                  }
              }
              if (!o) return;
              let a = !e;
              if (e)
                for (let r = 0; r < oc.length; r++) {
                  let i = oc[r];
                  t[i] !== e[i] && (a = !0);
                }
              a &&
                tb.read(() => {
                  !(function (t, e) {
                    try {
                      e.dimensions =
                        'function' == typeof t.getBBox ? t.getBBox() : t.getBoundingClientRect();
                    } catch (t) {
                      e.dimensions = { x: 0, y: 0, width: 0, height: 0 };
                    }
                  })(r, i),
                    tb.render(() => {
                      ot(i, n, oi(r.tagName), t.transformTemplate), oa(r, i);
                    });
                });
            },
          }),
        },
        oh = { useVisualState: n5({ scrapeMotionValuesFromProps: ol, createRenderState: oe }) };
      function op(t, e, r) {
        for (let i in e) tM(e[i]) || os(i, r) || (t[i] = e[i]);
      }
      let of = new Set([
        'animate',
        'exit',
        'variants',
        'initial',
        'style',
        'values',
        'variants',
        'transition',
        'transformTemplate',
        'custom',
        'inherit',
        'onBeforeLayoutMeasure',
        'onAnimationStart',
        'onAnimationComplete',
        'onUpdate',
        'onDragStart',
        'onDrag',
        'onDragEnd',
        'onMeasureDragConstraints',
        'onDirectionLock',
        'onDragTransitionEnd',
        '_dragX',
        '_dragY',
        'onHoverStart',
        'onHoverEnd',
        'onViewportEnter',
        'onViewportLeave',
        'globalTapTarget',
        'ignoreStrict',
        'viewport',
      ]);
      function om(t) {
        return (
          t.startsWith('while') ||
          (t.startsWith('drag') && 'draggable' !== t) ||
          t.startsWith('layout') ||
          t.startsWith('onTap') ||
          t.startsWith('onPan') ||
          t.startsWith('onLayout') ||
          of.has(t)
        );
      }
      let og = (t) => !om(t);
      try {
        (n = require('@emotion/is-prop-valid').default) &&
          (og = (t) => (t.startsWith('on') ? !om(t) : n(t)));
      } catch (t) {}
      let ov = { current: null },
        oy = { current: !1 },
        ob = [...eY, ea, em],
        ox = (t) => ob.find(eH(t)),
        oS = new WeakMap(),
        ok = [
          'AnimationStart',
          'AnimationComplete',
          'Update',
          'BeforeLayoutMeasure',
          'LayoutMeasure',
          'LayoutAnimationStart',
          'LayoutAnimationComplete',
        ];
      class ow {
        scrapeMotionValuesFromProps(t, e, r) {
          return {};
        }
        constructor(
          {
            parent: t,
            props: e,
            presenceContext: r,
            reducedMotionConfig: i,
            blockInitialAnimation: n,
            visualState: o,
          },
          a = {}
        ) {
          (this.current = null),
            (this.children = new Set()),
            (this.isVariantNode = !1),
            (this.isControllingVariants = !1),
            (this.shouldReduceMotion = null),
            (this.values = new Map()),
            (this.KeyframeResolver = eV),
            (this.features = {}),
            (this.valueSubscriptions = new Map()),
            (this.prevMotionValues = {}),
            (this.events = {}),
            (this.propEventSubscriptions = {}),
            (this.notifyUpdate = () => this.notify('Update', this.latestValues)),
            (this.render = () => {
              this.current &&
                (this.triggerBuild(),
                this.renderInstance(
                  this.current,
                  this.renderState,
                  this.props.style,
                  this.projection
                ));
            }),
            (this.renderScheduledAt = 0),
            (this.scheduleRender = () => {
              let t = tT.now();
              this.renderScheduledAt < t &&
                ((this.renderScheduledAt = t), tb.render(this.render, !1, !0));
            });
          let { latestValues: s, renderState: l, onUpdate: u } = o;
          (this.onUpdate = u),
            (this.latestValues = s),
            (this.baseTarget = { ...s }),
            (this.initialValues = e.initial ? { ...s } : {}),
            (this.renderState = l),
            (this.parent = t),
            (this.props = e),
            (this.presenceContext = r),
            (this.depth = t ? t.depth + 1 : 0),
            (this.reducedMotionConfig = i),
            (this.options = a),
            (this.blockInitialAnimation = !!n),
            (this.isControllingVariants = nG(e)),
            (this.isVariantNode = nq(e)),
            this.isVariantNode && (this.variantChildren = new Set()),
            (this.manuallyAnimateOnMount = !!(t && t.current));
          let { willChange: c, ...d } = this.scrapeMotionValuesFromProps(e, {}, this);
          for (let t in d) {
            let e = d[t];
            void 0 !== s[t] && tM(e) && e.set(s[t], !1);
          }
        }
        mount(t) {
          (this.current = t),
            oS.set(t, this),
            this.projection && !this.projection.instance && this.projection.mount(t),
            this.parent &&
              this.isVariantNode &&
              !this.isControllingVariants &&
              (this.removeFromVariantTree = this.parent.addVariantChild(this)),
            this.values.forEach((t, e) => this.bindToMotionValue(e, t)),
            oy.current ||
              (function () {
                if (((oy.current = !0), k)) {
                  if (window.matchMedia) {
                    let t = window.matchMedia('(prefers-reduced-motion)'),
                      e = () => (ov.current = t.matches);
                    t.addListener(e), e();
                  } else ov.current = !1;
                }
              })(),
            (this.shouldReduceMotion =
              'never' !== this.reducedMotionConfig &&
              ('always' === this.reducedMotionConfig || ov.current)),
            this.parent && this.parent.children.add(this),
            this.update(this.props, this.presenceContext);
        }
        unmount() {
          for (let t in (oS.delete(this.current),
          this.projection && this.projection.unmount(),
          tx(this.notifyUpdate),
          tx(this.render),
          this.valueSubscriptions.forEach((t) => t()),
          this.valueSubscriptions.clear(),
          this.removeFromVariantTree && this.removeFromVariantTree(),
          this.parent && this.parent.children.delete(this),
          this.events))
            this.events[t].clear();
          for (let t in this.features) {
            let e = this.features[t];
            e && (e.unmount(), (e.isMounted = !1));
          }
          this.current = null;
        }
        bindToMotionValue(t, e) {
          let r;
          this.valueSubscriptions.has(t) && this.valueSubscriptions.get(t)();
          let i = th.has(t),
            n = e.on('change', (e) => {
              (this.latestValues[t] = e),
                this.props.onUpdate && tb.preRender(this.notifyUpdate),
                i && this.projection && (this.projection.isTransformDirty = !0);
            }),
            o = e.on('renderRequest', this.scheduleRender);
          window.MotionCheckAppearSync && (r = window.MotionCheckAppearSync(this, t, e)),
            this.valueSubscriptions.set(t, () => {
              n(), o(), r && r(), e.owner && e.stop();
            });
        }
        sortNodePosition(t) {
          return this.current && this.sortInstanceNodePosition && this.type === t.type
            ? this.sortInstanceNodePosition(this.current, t.current)
            : 0;
        }
        updateFeatures() {
          let t = 'animation';
          for (t in nJ) {
            let e = nJ[t];
            if (!e) continue;
            let { isEnabled: r, Feature: i } = e;
            if (
              (!this.features[t] && i && r(this.props) && (this.features[t] = new i(this)),
              this.features[t])
            ) {
              let e = this.features[t];
              e.isMounted ? e.update() : (e.mount(), (e.isMounted = !0));
            }
          }
        }
        triggerBuild() {
          this.build(this.renderState, this.latestValues, this.props);
        }
        measureViewportBox() {
          return this.current ? this.measureInstanceViewportBox(this.current, this.props) : il();
        }
        getStaticValue(t) {
          return this.latestValues[t];
        }
        setStaticValue(t, e) {
          this.latestValues[t] = e;
        }
        update(t, e) {
          (t.transformTemplate || this.props.transformTemplate) && this.scheduleRender(),
            (this.prevProps = this.props),
            (this.props = t),
            (this.prevPresenceContext = this.presenceContext),
            (this.presenceContext = e);
          for (let e = 0; e < ok.length; e++) {
            let r = ok[e];
            this.propEventSubscriptions[r] &&
              (this.propEventSubscriptions[r](), delete this.propEventSubscriptions[r]);
            let i = t['on' + r];
            i && (this.propEventSubscriptions[r] = this.on(r, i));
          }
          (this.prevMotionValues = (function (t, e, r) {
            for (let i in e) {
              let n = e[i],
                o = r[i];
              if (tM(n)) t.addValue(i, n);
              else if (tM(o)) t.addValue(i, t_(n, { owner: t }));
              else if (o !== n) {
                if (t.hasValue(i)) {
                  let e = t.getValue(i);
                  !0 === e.liveStyle ? e.jump(n) : e.hasAnimated || e.set(n);
                } else {
                  let e = t.getStaticValue(i);
                  t.addValue(i, t_(void 0 !== e ? e : n, { owner: t }));
                }
              }
            }
            for (let i in r) void 0 === e[i] && t.removeValue(i);
            return e;
          })(
            this,
            this.scrapeMotionValuesFromProps(t, this.prevProps, this),
            this.prevMotionValues
          )),
            this.handleChildMotionValue && this.handleChildMotionValue(),
            this.onUpdate && this.onUpdate(this);
        }
        getProps() {
          return this.props;
        }
        getVariant(t) {
          return this.props.variants ? this.props.variants[t] : void 0;
        }
        getDefaultTransition() {
          return this.props.transition;
        }
        getTransformPagePoint() {
          return this.props.transformPagePoint;
        }
        getClosestVariantNode() {
          return this.isVariantNode
            ? this
            : this.parent
              ? this.parent.getClosestVariantNode()
              : void 0;
        }
        addVariantChild(t) {
          let e = this.getClosestVariantNode();
          if (e)
            return e.variantChildren && e.variantChildren.add(t), () => e.variantChildren.delete(t);
        }
        addValue(t, e) {
          let r = this.values.get(t);
          e !== r &&
            (r && this.removeValue(t),
            this.bindToMotionValue(t, e),
            this.values.set(t, e),
            (this.latestValues[t] = e.get()));
        }
        removeValue(t) {
          this.values.delete(t);
          let e = this.valueSubscriptions.get(t);
          e && (e(), this.valueSubscriptions.delete(t)),
            delete this.latestValues[t],
            this.removeValueFromRenderState(t, this.renderState);
        }
        hasValue(t) {
          return this.values.has(t);
        }
        getValue(t, e) {
          if (this.props.values && this.props.values[t]) return this.props.values[t];
          let r = this.values.get(t);
          return (
            void 0 === r &&
              void 0 !== e &&
              ((r = t_(null === e ? void 0 : e, { owner: this })), this.addValue(t, r)),
            r
          );
        }
        readValue(t, e) {
          var r;
          let i =
            void 0 === this.latestValues[t] && this.current
              ? null !== (r = this.getBaseTargetFromProps(this.props, t)) && void 0 !== r
                ? r
                : this.readValueFromInstance(this.current, t, this.options)
              : this.latestValues[t];
          return (
            null != i &&
              ('string' == typeof i && (eI(i) || tG(i))
                ? (i = parseFloat(i))
                : !ox(i) && em.test(e) && (i = eT(t, e)),
              this.setBaseTarget(t, tM(i) ? i.get() : i)),
            tM(i) ? i.get() : i
          );
        }
        setBaseTarget(t, e) {
          this.baseTarget[t] = e;
        }
        getBaseTarget(t) {
          var e;
          let r;
          let { initial: i } = this.props;
          if ('string' == typeof i || 'object' == typeof i) {
            let n = M(
              this.props,
              i,
              null === (e = this.presenceContext) || void 0 === e ? void 0 : e.custom
            );
            n && (r = n[t]);
          }
          if (i && void 0 !== r) return r;
          let n = this.getBaseTargetFromProps(this.props, t);
          return void 0 === n || tM(n)
            ? void 0 !== this.initialValues[t] && void 0 === r
              ? void 0
              : this.baseTarget[t]
            : n;
        }
        on(t, e) {
          return this.events[t] || (this.events[t] = new tC()), this.events[t].add(e);
        }
        notify(t, ...e) {
          this.events[t] && this.events[t].notify(...e);
        }
      }
      class oT extends ow {
        constructor() {
          super(...arguments), (this.KeyframeResolver = eG);
        }
        sortInstanceNodePosition(t, e) {
          return 2 & t.compareDocumentPosition(e) ? 1 : -1;
        }
        getBaseTargetFromProps(t, e) {
          return t.style ? t.style[e] : void 0;
        }
        removeValueFromRenderState(t, { vars: e, style: r }) {
          delete e[t], delete r[t];
        }
        handleChildMotionValue() {
          this.childSubscription && (this.childSubscription(), delete this.childSubscription);
          let { children: t } = this.props;
          tM(t) &&
            (this.childSubscription = t.on('change', (t) => {
              this.current && (this.current.textContent = `${t}`);
            }));
        }
      }
      class oP extends oT {
        constructor() {
          super(...arguments), (this.type = 'html'), (this.renderInstance = on);
        }
        readValueFromInstance(t, e) {
          if (th.has(e)) {
            let t = ew(e);
            return (t && t.default) || 0;
          }
          {
            let r = window.getComputedStyle(t),
              i = (eF(e) ? r.getPropertyValue(e) : r[e]) || 0;
            return 'string' == typeof i ? i.trim() : i;
          }
        }
        measureInstanceViewportBox(t, { transformPagePoint: e }) {
          return ik(t, e);
        }
        build(t, e, r) {
          n9(t, e, r.transformTemplate);
        }
        scrapeMotionValuesFromProps(t, e, r) {
          return ol(t, e, r);
        }
      }
      class oA extends oT {
        constructor() {
          super(...arguments),
            (this.type = 'svg'),
            (this.isSVGTag = !1),
            (this.measureInstanceViewportBox = il);
        }
        getBaseTargetFromProps(t, e) {
          return t[e];
        }
        readValueFromInstance(t, e) {
          if (th.has(e)) {
            let t = ew(e);
            return (t && t.default) || 0;
          }
          return (e = oo.has(e) ? e : tD(e)), t.getAttribute(e);
        }
        scrapeMotionValuesFromProps(t, e, r) {
          return ou(t, e, r);
        }
        build(t, e, r) {
          ot(t, e, this.isSVGTag, r.transformTemplate);
        }
        renderInstance(t, e, r, i) {
          oa(t, e, r, i);
        }
        mount(t) {
          (this.isSVGTag = oi(t.tagName)), super.mount(t);
        }
      }
      let oC = (function (t) {
        if ('undefined' == typeof Proxy) return t;
        let e = new Map();
        return new Proxy((...e) => t(...e), {
          get: (r, i) => ('create' === i ? t : (e.has(i) || e.set(i, t(i)), e.get(i))),
        });
      })(
        ((o = {
          animation: { Feature: rU },
          exit: { Feature: rY },
          inView: { Feature: nH },
          tap: { Feature: n$ },
          focus: { Feature: nV },
          hover: { Feature: nO },
          pan: { Feature: iR },
          drag: { Feature: iC, ProjectionNode: nD, MeasureLayout: iI },
          layout: { ProjectionNode: nD, MeasureLayout: iI },
        }),
        (a = (t, e) => (n1(t) ? new oA(e) : new oP(e, { allowProjection: t !== c.Fragment }))),
        function (t, { forwardMotionProps: e } = { forwardMotionProps: !1 }) {
          return (function (t) {
            var e, r;
            let {
              preloadedFeatures: i,
              createVisualElement: n,
              useRender: o,
              useVisualState: a,
              Component: s,
            } = t;
            function u(t, e) {
              var r;
              let i;
              let u = {
                  ...(0, c.useContext)(f),
                  ...t,
                  layoutId: (function (t) {
                    let { layoutId: e } = t,
                      r = (0, c.useContext)(d).id;
                    return r && void 0 !== e ? r + '-' + e : e;
                  })(t),
                },
                { isStatic: h } = u,
                m = (function (t) {
                  let { initial: e, animate: r } = (function (t, e) {
                    if (nG(t)) {
                      let { initial: e, animate: r } = t;
                      return { initial: !1 === e || j(e) ? e : void 0, animate: j(r) ? r : void 0 };
                    }
                    return !1 !== t.inherit ? e : {};
                  })(t, (0, c.useContext)(nX));
                  return (0, c.useMemo)(() => ({ initial: e, animate: r }), [nK(e), nK(r)]);
                })(t),
                g = a(t, h);
              if (!h && k) {
                (0, c.useContext)(nY).strict;
                let t = (function (t) {
                  let { drag: e, layout: r } = nJ;
                  if (!e && !r) return {};
                  let i = { ...e, ...r };
                  return {
                    MeasureLayout:
                      (null == e ? void 0 : e.isEnabled(t)) || (null == r ? void 0 : r.isEnabled(t))
                        ? i.MeasureLayout
                        : void 0,
                    ProjectionNode: i.ProjectionNode,
                  };
                })(u);
                (i = t.MeasureLayout),
                  (m.visualElement = (function (t, e, r, i, n) {
                    var o, a;
                    let { visualElement: s } = (0, c.useContext)(nX),
                      l = (0, c.useContext)(nY),
                      u = (0, c.useContext)(p),
                      d = (0, c.useContext)(f).reducedMotion,
                      h = (0, c.useRef)(null);
                    (i = i || l.renderer),
                      !h.current &&
                        i &&
                        (h.current = i(t, {
                          visualState: e,
                          parent: s,
                          props: r,
                          presenceContext: u,
                          blockInitialAnimation: !!u && !1 === u.initial,
                          reducedMotionConfig: d,
                        }));
                    let m = h.current,
                      g = (0, c.useContext)(ij);
                    m &&
                      !m.projection &&
                      n &&
                      ('html' === m.type || 'svg' === m.type) &&
                      (function (t, e, r, i) {
                        let {
                          layoutId: n,
                          layout: o,
                          drag: a,
                          dragConstraints: s,
                          layoutScroll: l,
                          layoutRoot: u,
                        } = e;
                        (t.projection = new r(
                          t.latestValues,
                          e['data-framer-portal-id']
                            ? void 0
                            : (function t(e) {
                                if (e)
                                  return !1 !== e.options.allowProjection
                                    ? e.projection
                                    : t(e.parent);
                              })(t.parent)
                        )),
                          t.projection.setOptions({
                            layoutId: n,
                            layout: o,
                            alwaysMeasureLayout: !!a || (s && r2(s)),
                            visualElement: t,
                            animationType: 'string' == typeof o ? o : 'both',
                            initialPromotionConfig: i,
                            layoutScroll: l,
                            layoutRoot: u,
                          });
                      })(h.current, r, n, g);
                    let v = (0, c.useRef)(!1);
                    (0, c.useInsertionEffect)(() => {
                      m && v.current && m.update(r, u);
                    });
                    let y = r[tL],
                      b = (0, c.useRef)(
                        !!y &&
                          !(null === (o = window.MotionHandoffIsComplete) || void 0 === o
                            ? void 0
                            : o.call(window, y)) &&
                          (null === (a = window.MotionHasOptimisedAnimation) || void 0 === a
                            ? void 0
                            : a.call(window, y))
                      );
                    return (
                      w(() => {
                        m &&
                          ((v.current = !0),
                          (window.MotionIsMounted = !0),
                          m.updateFeatures(),
                          iL.render(m.render),
                          b.current && m.animationState && m.animationState.animateChanges());
                      }),
                      (0, c.useEffect)(() => {
                        m &&
                          (!b.current && m.animationState && m.animationState.animateChanges(),
                          b.current &&
                            (queueMicrotask(() => {
                              var t;
                              null === (t = window.MotionHandoffMarkAsComplete) ||
                                void 0 === t ||
                                t.call(window, y);
                            }),
                            (b.current = !1)));
                      }),
                      m
                    );
                  })(s, g, u, n, t.ProjectionNode));
              }
              return (0, l.jsxs)(nX.Provider, {
                value: m,
                children: [
                  i && m.visualElement
                    ? (0, l.jsx)(i, { visualElement: m.visualElement, ...u })
                    : null,
                  o(
                    s,
                    t,
                    ((r = m.visualElement),
                    (0, c.useCallback)(
                      (t) => {
                        t && g.onMount && g.onMount(t),
                          r && (t ? r.mount(t) : r.unmount()),
                          e && ('function' == typeof e ? e(t) : r2(e) && (e.current = t));
                      },
                      [r]
                    )),
                    g,
                    h,
                    m.visualElement
                  ),
                ],
              });
            }
            i &&
              (function (t) {
                for (let e in t) nJ[e] = { ...nJ[e], ...t[e] };
              })(i),
              (u.displayName = 'motion.'.concat(
                'string' == typeof s
                  ? s
                  : 'create('.concat(
                      null !== (r = null !== (e = s.displayName) && void 0 !== e ? e : s.name) &&
                        void 0 !== r
                        ? r
                        : '',
                      ')'
                    )
              ));
            let h = (0, c.forwardRef)(u);
            return (h[nQ] = s), h;
          })({
            ...(n1(t) ? od : oh),
            preloadedFeatures: o,
            useRender: (function (t = !1) {
              return (e, r, i, { latestValues: n }, o) => {
                let a = (
                    n1(e)
                      ? function (t, e, r, i) {
                          let n = (0, c.useMemo)(() => {
                            let r = or();
                            return (
                              ot(r, e, oi(i), t.transformTemplate),
                              { ...r.attrs, style: { ...r.style } }
                            );
                          }, [e]);
                          if (t.style) {
                            let e = {};
                            op(e, t.style, t), (n.style = { ...e, ...n.style });
                          }
                          return n;
                        }
                      : function (t, e) {
                          let r = {},
                            i = (function (t, e) {
                              let r = t.style || {},
                                i = {};
                              return (
                                op(i, r, t),
                                Object.assign(
                                  i,
                                  (function ({ transformTemplate: t }, e) {
                                    return (0, c.useMemo)(() => {
                                      let r = oe();
                                      return n9(r, e, t), Object.assign({}, r.vars, r.style);
                                    }, [e]);
                                  })(t, e)
                                ),
                                i
                              );
                            })(t, e);
                          return (
                            t.drag &&
                              !1 !== t.dragListener &&
                              ((r.draggable = !1),
                              (i.userSelect = i.WebkitUserSelect = i.WebkitTouchCallout = 'none'),
                              (i.touchAction =
                                !0 === t.drag ? 'none' : `pan-${'x' === t.drag ? 'y' : 'x'}`)),
                            void 0 === t.tabIndex &&
                              (t.onTap || t.onTapStart || t.whileTap) &&
                              (r.tabIndex = 0),
                            (r.style = i),
                            r
                          );
                        }
                  )(r, n, o, e),
                  s = (function (t, e, r) {
                    let i = {};
                    for (let n in t)
                      ('values' !== n || 'object' != typeof t.values) &&
                        (og(n) ||
                          (!0 === r && om(n)) ||
                          (!e && !om(n)) ||
                          (t.draggable && n.startsWith('onDrag'))) &&
                        (i[n] = t[n]);
                    return i;
                  })(r, 'string' == typeof e, t),
                  l = e !== c.Fragment ? { ...s, ...a, ref: i } : {},
                  { children: u } = r,
                  d = (0, c.useMemo)(() => (tM(u) ? u.get() : u), [u]);
                return (0, c.createElement)(e, { ...l, children: d });
              };
            })(e),
            createVisualElement: a,
            Component: t,
          });
        })
      );
      var oE = r(7262),
        oR = r(2395);
      let oj = {
          initial: (t) => {
            let { position: e } = t,
              r = ['top', 'bottom'].includes(e) ? 'y' : 'x',
              i = ['top-right', 'bottom-right'].includes(e) ? 1 : -1;
            return 'bottom' === e && (i = 1), { opacity: 0, [r]: 24 * i };
          },
          animate: {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
          },
          exit: { opacity: 0, scale: 0.85, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
        },
        o_ = (0, c.memo)((t) => {
          var e;
          let {
              id: r,
              message: i,
              onCloseComplete: n,
              onRequestRemove: o,
              requestClose: a = !1,
              position: s = 'bottom',
              duration: u = 5e3,
              containerStyle: d,
              motionVariants: h = oj,
              toastSpacing: f = '0.5rem',
            } = t,
            [m, g] = (0, c.useState)(u),
            v = null === (e = (0, c.useContext)(p)) || e.isPresent;
          P(() => {
            v || null == n || n();
          }, [v]),
            P(() => {
              g(u);
            }, [u]);
          let y = () => {
            v && o();
          };
          (0, c.useEffect)(() => {
            v && a && o();
          }, [v, a, o]),
            (function (t, e) {
              let r = (function (t) {
                let e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : [],
                  r = (0, c.useRef)(t);
                return (
                  (0, c.useEffect)(() => {
                    r.current = t;
                  }),
                  (0, c.useCallback)(function () {
                    for (var t, e = arguments.length, i = Array(e), n = 0; n < e; n++)
                      i[n] = arguments[n];
                    return null === (t = r.current) || void 0 === t ? void 0 : t.call(r, ...i);
                  }, e)
                );
              })(t);
              (0, c.useEffect)(() => {
                if (null == e) return;
                let t = null;
                return (
                  (t = window.setTimeout(() => {
                    r();
                  }, e)),
                  () => {
                    t && window.clearTimeout(t);
                  }
                );
              }, [e, r]);
            })(y, m);
          let b = (0, c.useMemo)(
              () => ({ pointerEvents: 'auto', maxWidth: 560, minWidth: 300, margin: f, ...d }),
              [d, f]
            ),
            x = (0, c.useMemo)(() => (0, oE.sv)(s), [s]);
          return (0, l.jsx)(oC.div, {
            layout: !0,
            className: 'chakra-toast',
            variants: h,
            initial: 'initial',
            animate: 'animate',
            exit: 'exit',
            onHoverStart: () => g(null),
            onHoverEnd: () => g(u),
            custom: { position: s },
            style: x,
            children: (0, l.jsx)(oR.m.div, {
              role: 'status',
              'aria-atomic': 'true',
              className: 'chakra-toast__inner',
              __css: b,
              children: (0, A.P)(i, { id: r, onClose: y }),
            }),
          });
        });
      o_.displayName = 'ToastComponent';
      var oM = r(7389);
      let oB = (null === (s = globalThis) || void 0 === s ? void 0 : s.document)
        ? c.useLayoutEffect
        : c.useEffect;
      var oD = r(4482),
        oL = r(2330);
      let [oO, oV] = (0, u.k)({ strict: !1, name: 'PortalContext' }),
        oI = 'chakra-portal',
        o$ = (t) =>
          (0, l.jsx)('div', {
            className: 'chakra-portal-zIndex',
            style: { position: 'absolute', zIndex: t.zIndex, top: 0, left: 0, right: 0 },
            children: t.children,
          }),
        oF = (t) => {
          let { appendToParentPortal: e, children: r } = t,
            [i, n] = (0, c.useState)(null),
            o = (0, c.useRef)(null),
            [, a] = (0, c.useState)({});
          (0, c.useEffect)(() => a({}), []);
          let s = oV(),
            u = (0, oL.L)();
          oB(() => {
            if (!i) return;
            let t = i.ownerDocument,
              r = e && null != s ? s : t.body;
            if (!r) return;
            (o.current = t.createElement('div')),
              (o.current.className = oI),
              r.appendChild(o.current),
              a({});
            let n = o.current;
            return () => {
              r.contains(n) && r.removeChild(n);
            };
          }, [i]);
          let d = (null == u ? void 0 : u.zIndex)
            ? (0, l.jsx)(o$, { zIndex: null == u ? void 0 : u.zIndex, children: r })
            : r;
          return o.current
            ? (0, oD.createPortal)((0, l.jsx)(oO, { value: o.current, children: d }), o.current)
            : (0, l.jsx)('span', {
                ref: (t) => {
                  t && n(t);
                },
              });
        },
        oz = (t) => {
          let { children: e, containerRef: r, appendToParentPortal: i } = t,
            n = r.current,
            o = null != n ? n : 'undefined' != typeof window ? document.body : void 0,
            a = (0, c.useMemo)(() => {
              let t = null == n ? void 0 : n.ownerDocument.createElement('div');
              return t && (t.className = oI), t;
            }, [n]),
            [, s] = (0, c.useState)({});
          return (oB(() => s({}), []),
          oB(() => {
            if (a && o)
              return (
                o.appendChild(a),
                () => {
                  o.removeChild(a);
                }
              );
          }, [a, o]),
          o && a)
            ? (0, oD.createPortal)((0, l.jsx)(oO, { value: i ? a : null, children: e }), a)
            : null;
        };
      function oW(t) {
        let { containerRef: e, ...r } = { appendToParentPortal: !0, ...t };
        return e ? (0, l.jsx)(oz, { containerRef: e, ...r }) : (0, l.jsx)(oF, { ...r });
      }
      (oW.className = oI), (oW.selector = '.chakra-portal'), (oW.displayName = 'Portal');
      let [oN, oU] = (0, u.k)({ name: 'ToastOptionsContext', strict: !1 }),
        oH = (t) => {
          let e = (0, c.useSyncExternalStore)(oM.f.subscribe, oM.f.getState, oM.f.getState),
            { motionVariants: r, component: i = o_, portalProps: n, animatePresenceProps: o } = t,
            a = Object.keys(e).map((t) => {
              let n = e[t];
              return (0, l.jsx)(
                'div',
                {
                  role: 'region',
                  'aria-live': 'polite',
                  'aria-label': 'Notifications-'.concat(t),
                  id: 'chakra-toast-manager-'.concat(t),
                  style: (0, oE.IW)(t),
                  children: (0, l.jsx)(T, {
                    ...o,
                    initial: !1,
                    children: n.map((t) => (0, l.jsx)(i, { motionVariants: r, ...t }, t.id)),
                  }),
                },
                t
              );
            });
          return (0, l.jsx)(oW, { ...n, children: a });
        };
    },
    7389: function (t, e, r) {
      'use strict';
      r.d(e, {
        f: function () {
          return o;
        },
      });
      var i = r(1419),
        n = r(7262);
      let o = (function (t) {
          let e = t,
            r = new Set(),
            s = (t) => {
              (e = t(e)), r.forEach((t) => t());
            };
          return {
            getState: () => e,
            subscribe: (e) => (
              r.add(e),
              () => {
                s(() => t), r.delete(e);
              }
            ),
            removeToast: (t, e) => {
              s((r) => ({ ...r, [e]: r[e].filter((e) => e.id != t) }));
            },
            notify: (t, e) => {
              let r = (function (t) {
                  var e, r;
                  let i = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
                  a += 1;
                  let n = null !== (e = i.id) && void 0 !== e ? e : a,
                    s = null !== (r = i.position) && void 0 !== r ? r : 'bottom';
                  return {
                    id: n,
                    message: t,
                    position: s,
                    duration: i.duration,
                    onCloseComplete: i.onCloseComplete,
                    onRequestRemove: () => o.removeToast(String(n), s),
                    status: i.status,
                    requestClose: !1,
                    containerStyle: i.containerStyle,
                  };
                })(t, e),
                { position: i, id: n } = r;
              return (
                s((t) => {
                  var e, n;
                  let o = i.includes('top')
                    ? [r, ...(null !== (e = t[i]) && void 0 !== e ? e : [])]
                    : [...(null !== (n = t[i]) && void 0 !== n ? n : []), r];
                  return { ...t, [i]: o };
                }),
                n
              );
            },
            update: (t, e) => {
              t &&
                s((r) => {
                  let o = { ...r },
                    { position: a, index: s } = (0, n.Dn)(o, t);
                  return a && -1 !== s && (o[a][s] = { ...o[a][s], ...e, message: (0, i.C)(e) }), o;
                });
            },
            closeAll: function () {
              let { positions: t } =
                arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
              s((e) =>
                (null != t
                  ? t
                  : ['bottom', 'bottom-right', 'bottom-left', 'top', 'top-left', 'top-right']
                ).reduce((t, r) => ((t[r] = e[r].map((t) => ({ ...t, requestClose: !0 }))), t), {
                  ...e,
                })
              );
            },
            close: (t) => {
              s((e) => {
                let r = (0, n.ym)(e, t);
                return r
                  ? { ...e, [r]: e[r].map((e) => (e.id == t ? { ...e, requestClose: !0 } : e)) }
                  : e;
              });
            },
            isActive: (t) => !!(0, n.Dn)(o.getState(), t).position,
          };
        })({
          top: [],
          'top-left': [],
          'top-right': [],
          'bottom-left': [],
          bottom: [],
          'bottom-right': [],
        }),
        a = 0;
    },
    7262: function (t, e, r) {
      'use strict';
      r.d(e, {
        Dn: function () {
          return n;
        },
        IW: function () {
          return s;
        },
        sv: function () {
          return a;
        },
        ym: function () {
          return o;
        },
      });
      let i = (t, e) => t.find((t) => t.id === e);
      function n(t, e) {
        let r = o(t, e),
          i = r ? t[r].findIndex((t) => t.id === e) : -1;
        return { position: r, index: i };
      }
      function o(t, e) {
        for (let [r, n] of Object.entries(t)) if (i(n, e)) return r;
      }
      function a(t) {
        let e = t.includes('right'),
          r = t.includes('left'),
          i = 'center';
        return (
          e && (i = 'flex-end'),
          r && (i = 'flex-start'),
          { display: 'flex', flexDirection: 'column', alignItems: i }
        );
      }
      function s(t) {
        let e = t.includes('top') ? 'env(safe-area-inset-top, 0px)' : void 0,
          r = t.includes('bottom') ? 'env(safe-area-inset-bottom, 0px)' : void 0,
          i = t.includes('left') ? void 0 : 'env(safe-area-inset-right, 0px)',
          n = t.includes('right') ? void 0 : 'env(safe-area-inset-left, 0px)';
        return {
          position: 'fixed',
          zIndex: 'var(--toast-z-index, 5500)',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          margin: 'top' === t || 'bottom' === t ? '0 auto' : void 0,
          top: e,
          bottom: r,
          right: i,
          left: n,
        };
      }
    },
    474: function (t, e, r) {
      'use strict';
      r.d(e, {
        i: function () {
          return d;
        },
      });
      var i = r(3075),
        n = r(1055),
        o = r(8626),
        a = r(8954),
        s = r(3895);
      let l = (t) => (e) => {
          if (!e.__breakpoints) return t;
          let { isResponsive: r, toArrayValue: o, media: a } = e.__breakpoints,
            s = {};
          for (let l in t) {
            let u = (0, i.P)(t[l], e);
            if (null == u) continue;
            if (!Array.isArray((u = (0, n.Kn)(u) && r(u) ? o(u) : u))) {
              s[l] = u;
              continue;
            }
            let c = u.slice(0, a.length).length;
            for (let t = 0; t < c; t += 1) {
              let e = a?.[t];
              if (!e) {
                s[l] = u[t];
                continue;
              }
              (s[e] = s[e] || {}), null != u[t] && (s[e][l] = u[t]);
            }
          }
          return s;
        },
        u = (t, e) => t.startsWith('--') && 'string' == typeof e && !/^var\(--.+\)$/.test(e),
        c = (t, e) => {
          if (null == e) return e;
          let r = (e) => t.__cssMap?.[e]?.varRef,
            i = (t) => r(t) ?? t,
            [n, o] = (function (t) {
              let e = [],
                r = '',
                i = !1;
              for (let n = 0; n < t.length; n++) {
                let o = t[n];
                '(' === o
                  ? ((i = !0), (r += o))
                  : ')' === o
                    ? ((i = !1), (r += o))
                    : ',' !== o || i
                      ? (r += o)
                      : (e.push(r), (r = ''));
              }
              return (r = r.trim()) && e.push(r), e;
            })(e);
          return (e = r(n) ?? i(o) ?? i(e));
        },
        d = (t) => (e) =>
          (function (t) {
            let { configs: e = {}, pseudos: r = {}, theme: a } = t,
              s = (t, d = !1) => {
                let h = (0, i.P)(t, a),
                  p = l(h)(a),
                  f = {};
                for (let t in p) {
                  let l = p[t],
                    m = (0, i.P)(l, a);
                  t in r && (t = r[t]), u(t, m) && (m = c(a, m));
                  let g = e[t];
                  if ((!0 === g && (g = { property: t }), (0, n.Kn)(m))) {
                    (f[t] = f[t] ?? {}), (f[t] = o({}, f[t], s(m, !0)));
                    continue;
                  }
                  let v = g?.transform?.(m, a, h) ?? m;
                  v = g?.processResult ? s(v, !0) : v;
                  let y = (0, i.P)(g?.property, a);
                  if (
                    (!d && g?.static && (f = o({}, f, (0, i.P)(g.static, a))),
                    y && Array.isArray(y))
                  ) {
                    for (let t of y) f[t] = v;
                    continue;
                  }
                  if (y) {
                    '&' === y && (0, n.Kn)(v) ? (f = o({}, f, v)) : (f[y] = v);
                    continue;
                  }
                  if ((0, n.Kn)(v)) {
                    f = o({}, f, v);
                    continue;
                  }
                  f[t] = v;
                }
                return f;
              };
            return s;
          })({ theme: e, pseudos: a.v, configs: s.Ul })(t);
    },
    4073: function (t, e, r) {
      'use strict';
      function i(t) {
        return t;
      }
      function n(t) {
        return t;
      }
      function o(t) {
        return { definePartsStyle: (t) => t, defineMultiStyleConfig: (e) => ({ parts: t, ...e }) };
      }
      r.d(e, {
        D: function () {
          return o;
        },
        fj: function () {
          return n;
        },
        k0: function () {
          return i;
        },
      });
    },
    8954: function (t, e, r) {
      'use strict';
      r.d(e, {
        _: function () {
          return m;
        },
        v: function () {
          return f;
        },
      });
      let i = (t, e) => `${t}:hover ${e}, ${t}[data-hover] ${e}`,
        n = (t, e) => `${t}:focus ${e}, ${t}[data-focus] ${e}`,
        o = (t, e) => `${t}:focus-visible ${e}`,
        a = (t, e) => `${t}:focus-within ${e}`,
        s = (t, e) => `${t}:active ${e}, ${t}[data-active] ${e}`,
        l = (t, e) => `${t}:disabled ${e}, ${t}[data-disabled] ${e}`,
        u = (t, e) => `${t}:invalid ${e}, ${t}[data-invalid] ${e}`,
        c = (t, e) => `${t}:checked ${e}, ${t}[data-checked] ${e}`,
        d = (t) => p((e) => t(e, '&'), '[role=group]', '[data-group]', '.group'),
        h = (t) => p((e) => t(e, '~ &'), '[data-peer]', '.peer'),
        p = (t, ...e) => e.map(t).join(', '),
        f = {
          _hover: '&:hover, &[data-hover]',
          _active: '&:active, &[data-active]',
          _focus: '&:focus, &[data-focus]',
          _highlighted: '&[data-highlighted]',
          _focusWithin: '&:focus-within, &[data-focus-within]',
          _focusVisible: '&:focus-visible, &[data-focus-visible]',
          _disabled: '&:disabled, &[disabled], &[aria-disabled=true], &[data-disabled]',
          _readOnly: '&[aria-readonly=true], &[readonly], &[data-readonly]',
          _before: '&::before',
          _after: '&::after',
          _empty: '&:empty, &[data-empty]',
          _expanded: '&[aria-expanded=true], &[data-expanded], &[data-state=expanded]',
          _checked: '&[aria-checked=true], &[data-checked], &[data-state=checked]',
          _grabbed: '&[aria-grabbed=true], &[data-grabbed]',
          _pressed: '&[aria-pressed=true], &[data-pressed]',
          _invalid: '&[aria-invalid=true], &[data-invalid]',
          _valid: '&[data-valid], &[data-state=valid]',
          _loading: '&[data-loading], &[aria-busy=true]',
          _selected: '&[aria-selected=true], &[data-selected]',
          _hidden: '&[hidden], &[data-hidden]',
          _autofill: '&:-webkit-autofill',
          _even: '&:nth-of-type(even)',
          _odd: '&:nth-of-type(odd)',
          _first: '&:first-of-type',
          _firstLetter: '&::first-letter',
          _last: '&:last-of-type',
          _notFirst: '&:not(:first-of-type)',
          _notLast: '&:not(:last-of-type)',
          _visited: '&:visited',
          _activeLink: '&[aria-current=page]',
          _activeStep: '&[aria-current=step]',
          _indeterminate:
            '&:indeterminate, &[aria-checked=mixed], &[data-indeterminate], &[data-state=indeterminate]',
          _groupOpen: d((t, e) => `${t}[data-open], ${t}[open], ${t}[data-state=open] ${e}`),
          _groupClosed: d((t, e) => `${t}[data-closed], ${t}[data-state=closed] ${e}`),
          _groupHover: d(i),
          _peerHover: h(i),
          _groupFocus: d(n),
          _peerFocus: h(n),
          _groupFocusVisible: d(o),
          _peerFocusVisible: h(o),
          _groupActive: d(s),
          _peerActive: h(s),
          _groupDisabled: d(l),
          _peerDisabled: h(l),
          _groupInvalid: d(u),
          _peerInvalid: h(u),
          _groupChecked: d(c),
          _peerChecked: h(c),
          _groupFocusWithin: d(a),
          _peerFocusWithin: h(a),
          _peerPlaceholderShown: h((t, e) => `${t}:placeholder-shown ${e}`),
          _placeholder: '&::placeholder, &[data-placeholder]',
          _placeholderShown: '&:placeholder-shown, &[data-placeholder-shown]',
          _fullScreen: '&:fullscreen, &[data-fullscreen]',
          _selection: '&::selection',
          _rtl: '[dir=rtl] &, &[dir=rtl]',
          _ltr: '[dir=ltr] &, &[dir=ltr]',
          _mediaDark: '@media (prefers-color-scheme: dark)',
          _mediaReduceMotion: '@media (prefers-reduced-motion: reduce)',
          _dark:
            '.chakra-ui-dark &:not([data-theme]),[data-theme=dark] &:not([data-theme]),&[data-theme=dark]',
          _light:
            '.chakra-ui-light &:not([data-theme]),[data-theme=light] &:not([data-theme]),&[data-theme=light]',
          _horizontal: '&[data-orientation=horizontal]',
          _vertical: '&[data-orientation=vertical]',
          _open: '&[data-open], &[open], &[data-state=open]',
          _closed: '&[data-closed], &[data-state=closed]',
          _complete: '&[data-complete]',
          _incomplete: '&[data-incomplete]',
          _current: '&[data-current]',
        },
        m = Object.keys(f);
    },
    3895: function (t, e, r) {
      'use strict';
      r.d(e, {
        ZR: function () {
          return K;
        },
        oE: function () {
          return X;
        },
        cC: function () {
          return G;
        },
        Ul: function () {
          return Y;
        },
      });
      var i = r(8626),
        n = r(8954),
        o = r(1055);
      let a = (t) => /!(important)?$/.test(t),
        s = (t) => ('string' == typeof t ? t.replace(/!(important)?$/, '').trim() : t),
        l = (t, e) => (r) => {
          let i = String(e),
            n = a(i),
            l = s(i),
            u = t ? `${t}.${l}` : l,
            c = (0, o.Kn)(r.__cssMap) && u in r.__cssMap ? r.__cssMap[u].varRef : e;
          return (c = s(c)), n ? `${c} !important` : c;
        };
      function u(t) {
        let { scale: e, transform: r, compose: i } = t;
        return (t, n) => {
          let o = l(e, t)(n),
            a = r?.(o, n) ?? o;
          return i && (a = i(a, n)), a;
        };
      }
      let c =
        (...t) =>
        (e) =>
          t.reduce((t, e) => e(t), e);
      function d(t, e) {
        return (r) => {
          let i = { property: r, scale: t };
          return (i.transform = u({ scale: t, transform: e })), i;
        };
      }
      let h =
          ({ rtl: t, ltr: e }) =>
          (r) =>
            'rtl' === r.direction ? t : e,
        p = [
          'rotate(var(--chakra-rotate, 0))',
          'scaleX(var(--chakra-scale-x, 1))',
          'scaleY(var(--chakra-scale-y, 1))',
          'skewX(var(--chakra-skew-x, 0))',
          'skewY(var(--chakra-skew-y, 0))',
        ],
        f = {
          '--chakra-blur': 'var(--chakra-empty,/*!*/ /*!*/)',
          '--chakra-brightness': 'var(--chakra-empty,/*!*/ /*!*/)',
          '--chakra-contrast': 'var(--chakra-empty,/*!*/ /*!*/)',
          '--chakra-grayscale': 'var(--chakra-empty,/*!*/ /*!*/)',
          '--chakra-hue-rotate': 'var(--chakra-empty,/*!*/ /*!*/)',
          '--chakra-invert': 'var(--chakra-empty,/*!*/ /*!*/)',
          '--chakra-saturate': 'var(--chakra-empty,/*!*/ /*!*/)',
          '--chakra-sepia': 'var(--chakra-empty,/*!*/ /*!*/)',
          '--chakra-drop-shadow': 'var(--chakra-empty,/*!*/ /*!*/)',
          filter:
            'var(--chakra-blur) var(--chakra-brightness) var(--chakra-contrast) var(--chakra-grayscale) var(--chakra-hue-rotate) var(--chakra-invert) var(--chakra-saturate) var(--chakra-sepia) var(--chakra-drop-shadow)',
        },
        m = {
          backdropFilter:
            'var(--chakra-backdrop-blur) var(--chakra-backdrop-brightness) var(--chakra-backdrop-contrast) var(--chakra-backdrop-grayscale) var(--chakra-backdrop-hue-rotate) var(--chakra-backdrop-invert) var(--chakra-backdrop-opacity) var(--chakra-backdrop-saturate) var(--chakra-backdrop-sepia)',
          '--chakra-backdrop-blur': 'var(--chakra-empty,/*!*/ /*!*/)',
          '--chakra-backdrop-brightness': 'var(--chakra-empty,/*!*/ /*!*/)',
          '--chakra-backdrop-contrast': 'var(--chakra-empty,/*!*/ /*!*/)',
          '--chakra-backdrop-grayscale': 'var(--chakra-empty,/*!*/ /*!*/)',
          '--chakra-backdrop-hue-rotate': 'var(--chakra-empty,/*!*/ /*!*/)',
          '--chakra-backdrop-invert': 'var(--chakra-empty,/*!*/ /*!*/)',
          '--chakra-backdrop-opacity': 'var(--chakra-empty,/*!*/ /*!*/)',
          '--chakra-backdrop-saturate': 'var(--chakra-empty,/*!*/ /*!*/)',
          '--chakra-backdrop-sepia': 'var(--chakra-empty,/*!*/ /*!*/)',
        },
        g = {
          'row-reverse': { space: '--chakra-space-x-reverse', divide: '--chakra-divide-x-reverse' },
          'column-reverse': {
            space: '--chakra-space-y-reverse',
            divide: '--chakra-divide-y-reverse',
          },
        },
        v = {
          'to-t': 'to top',
          'to-tr': 'to top right',
          'to-r': 'to right',
          'to-br': 'to bottom right',
          'to-b': 'to bottom',
          'to-bl': 'to bottom left',
          'to-l': 'to left',
          'to-tl': 'to top left',
        },
        y = new Set(Object.values(v)),
        b = new Set(['none', '-moz-initial', 'inherit', 'initial', 'revert', 'unset']),
        x = (t) => t.trim(),
        S = (t) => 'string' == typeof t && t.includes('(') && t.includes(')'),
        k = (t) => {
          let e = parseFloat(t.toString()),
            r = t.toString().replace(String(e), '');
          return { unitless: !r, value: e, unit: r };
        },
        w = (t) => (e) => `${t}(${e})`,
        T = {
          filter: (t) => ('auto' !== t ? t : f),
          backdropFilter: (t) => ('auto' !== t ? t : m),
          ring: (t) => ({
            '--chakra-ring-offset-shadow':
              'var(--chakra-ring-inset) 0 0 0 var(--chakra-ring-offset-width) var(--chakra-ring-offset-color)',
            '--chakra-ring-shadow':
              'var(--chakra-ring-inset) 0 0 0 calc(var(--chakra-ring-width) + var(--chakra-ring-offset-width)) var(--chakra-ring-color)',
            '--chakra-ring-width': T.px(t),
            boxShadow:
              'var(--chakra-ring-offset-shadow), var(--chakra-ring-shadow), var(--chakra-shadow, 0 0 #0000)',
          }),
          bgClip: (t) =>
            'text' === t ? { color: 'transparent', backgroundClip: 'text' } : { backgroundClip: t },
          transform: (t) =>
            'auto' === t
              ? [
                  'translateX(var(--chakra-translate-x, 0))',
                  'translateY(var(--chakra-translate-y, 0))',
                  ...p,
                ].join(' ')
              : 'auto-gpu' === t
                ? [
                    'translate3d(var(--chakra-translate-x, 0), var(--chakra-translate-y, 0), 0)',
                    ...p,
                  ].join(' ')
                : t,
          vh: (t) => ('$100vh' === t ? 'var(--chakra-vh)' : t),
          px(t) {
            if (null == t) return t;
            let { unitless: e } = k(t);
            return e || 'number' == typeof t ? `${t}px` : t;
          },
          fraction: (t) => ('number' != typeof t || t > 1 ? t : `${100 * t}%`),
          float: (t, e) => ('rtl' === e.direction ? { left: 'right', right: 'left' }[t] : t),
          degree(t) {
            if (/^var\(--.+\)$/.test(t) || null == t) return t;
            let e = 'string' == typeof t && !t.endsWith('deg');
            return 'number' == typeof t || e ? `${t}deg` : t;
          },
          gradient: (t, e) =>
            (function (t, e) {
              if (null == t || b.has(t)) return t;
              if (!(S(t) || b.has(t))) return `url('${t}')`;
              let r = /(^[a-z-A-Z]+)\((.*)\)/g.exec(t),
                i = r?.[1],
                n = r?.[2];
              if (!i || !n) return t;
              let o = i.includes('-gradient') ? i : `${i}-gradient`,
                [a, ...s] = n.split(',').map(x).filter(Boolean);
              if (s?.length === 0) return t;
              let l = a in v ? v[a] : a;
              s.unshift(l);
              let u = s.map((t) => {
                if (y.has(t)) return t;
                let r = t.indexOf(' '),
                  [i, n] = -1 !== r ? [t.substr(0, r), t.substr(r + 1)] : [t],
                  o = S(n) ? n : n && n.split(' '),
                  a = `colors.${i}`,
                  s = a in e.__cssMap ? e.__cssMap[a].varRef : i;
                return o ? [s, ...(Array.isArray(o) ? o : [o])].join(' ') : s;
              });
              return `${o}(${u.join(', ')})`;
            })(t, e ?? {}),
          blur: w('blur'),
          opacity: w('opacity'),
          brightness: w('brightness'),
          contrast: w('contrast'),
          dropShadow: w('drop-shadow'),
          grayscale: w('grayscale'),
          hueRotate: (t) => w('hue-rotate')(T.degree(t)),
          invert: w('invert'),
          saturate: w('saturate'),
          sepia: w('sepia'),
          bgImage: (t) => (null == t ? t : S(t) || b.has(t) ? t : `url(${t})`),
          outline(t) {
            let e = '0' === String(t) || 'none' === String(t);
            return null !== t && e
              ? { outline: '2px solid transparent', outlineOffset: '2px' }
              : { outline: t };
          },
          flexDirection(t) {
            let { space: e, divide: r } = g[t] ?? {},
              i = { flexDirection: t };
            return e && (i[e] = 1), r && (i[r] = 1), i;
          },
        },
        P = {
          borderWidths: d('borderWidths'),
          borderStyles: d('borderStyles'),
          colors: d('colors'),
          borders: d('borders'),
          gradients: d('gradients', T.gradient),
          radii: d('radii', T.px),
          space: d('space', c(T.vh, T.px)),
          spaceT: d('space', c(T.vh, T.px)),
          degreeT: (t) => ({ property: t, transform: T.degree }),
          prop: (t, e, r) => ({
            property: t,
            scale: e,
            ...(e && { transform: u({ scale: e, transform: r }) }),
          }),
          propT: (t, e) => ({ property: t, transform: e }),
          sizes: d('sizes', c(T.vh, T.px)),
          sizesT: d('sizes', c(T.vh, T.fraction)),
          shadows: d('shadows'),
          logical: function (t) {
            let { property: e, scale: r, transform: i } = t;
            return { scale: r, property: h(e), transform: r ? u({ scale: r, compose: i }) : i };
          },
          blur: d('blur', T.blur),
        },
        A = {
          background: P.colors('background'),
          backgroundColor: P.colors('backgroundColor'),
          backgroundImage: P.gradients('backgroundImage'),
          backgroundSize: !0,
          backgroundPosition: !0,
          backgroundRepeat: !0,
          backgroundAttachment: !0,
          backgroundClip: { transform: T.bgClip },
          bgSize: P.prop('backgroundSize'),
          bgPosition: P.prop('backgroundPosition'),
          bg: P.colors('background'),
          bgColor: P.colors('backgroundColor'),
          bgPos: P.prop('backgroundPosition'),
          bgRepeat: P.prop('backgroundRepeat'),
          bgAttachment: P.prop('backgroundAttachment'),
          bgGradient: P.gradients('backgroundImage'),
          bgClip: { transform: T.bgClip },
        };
      Object.assign(A, { bgImage: A.backgroundImage, bgImg: A.backgroundImage });
      let C = {
        border: P.borders('border'),
        borderWidth: P.borderWidths('borderWidth'),
        borderStyle: P.borderStyles('borderStyle'),
        borderColor: P.colors('borderColor'),
        borderRadius: P.radii('borderRadius'),
        borderTop: P.borders('borderTop'),
        borderBlockStart: P.borders('borderBlockStart'),
        borderTopLeftRadius: P.radii('borderTopLeftRadius'),
        borderStartStartRadius: P.logical({
          scale: 'radii',
          property: { ltr: 'borderTopLeftRadius', rtl: 'borderTopRightRadius' },
        }),
        borderEndStartRadius: P.logical({
          scale: 'radii',
          property: { ltr: 'borderBottomLeftRadius', rtl: 'borderBottomRightRadius' },
        }),
        borderTopRightRadius: P.radii('borderTopRightRadius'),
        borderStartEndRadius: P.logical({
          scale: 'radii',
          property: { ltr: 'borderTopRightRadius', rtl: 'borderTopLeftRadius' },
        }),
        borderEndEndRadius: P.logical({
          scale: 'radii',
          property: { ltr: 'borderBottomRightRadius', rtl: 'borderBottomLeftRadius' },
        }),
        borderRight: P.borders('borderRight'),
        borderInlineEnd: P.borders('borderInlineEnd'),
        borderBottom: P.borders('borderBottom'),
        borderBlockEnd: P.borders('borderBlockEnd'),
        borderBottomLeftRadius: P.radii('borderBottomLeftRadius'),
        borderBottomRightRadius: P.radii('borderBottomRightRadius'),
        borderLeft: P.borders('borderLeft'),
        borderInlineStart: { property: 'borderInlineStart', scale: 'borders' },
        borderInlineStartRadius: P.logical({
          scale: 'radii',
          property: {
            ltr: ['borderTopLeftRadius', 'borderBottomLeftRadius'],
            rtl: ['borderTopRightRadius', 'borderBottomRightRadius'],
          },
        }),
        borderInlineEndRadius: P.logical({
          scale: 'radii',
          property: {
            ltr: ['borderTopRightRadius', 'borderBottomRightRadius'],
            rtl: ['borderTopLeftRadius', 'borderBottomLeftRadius'],
          },
        }),
        borderX: P.borders(['borderLeft', 'borderRight']),
        borderInline: P.borders('borderInline'),
        borderY: P.borders(['borderTop', 'borderBottom']),
        borderBlock: P.borders('borderBlock'),
        borderTopWidth: P.borderWidths('borderTopWidth'),
        borderBlockStartWidth: P.borderWidths('borderBlockStartWidth'),
        borderTopColor: P.colors('borderTopColor'),
        borderBlockStartColor: P.colors('borderBlockStartColor'),
        borderTopStyle: P.borderStyles('borderTopStyle'),
        borderBlockStartStyle: P.borderStyles('borderBlockStartStyle'),
        borderBottomWidth: P.borderWidths('borderBottomWidth'),
        borderBlockEndWidth: P.borderWidths('borderBlockEndWidth'),
        borderBottomColor: P.colors('borderBottomColor'),
        borderBlockEndColor: P.colors('borderBlockEndColor'),
        borderBottomStyle: P.borderStyles('borderBottomStyle'),
        borderBlockEndStyle: P.borderStyles('borderBlockEndStyle'),
        borderLeftWidth: P.borderWidths('borderLeftWidth'),
        borderInlineStartWidth: P.borderWidths('borderInlineStartWidth'),
        borderLeftColor: P.colors('borderLeftColor'),
        borderInlineStartColor: P.colors('borderInlineStartColor'),
        borderLeftStyle: P.borderStyles('borderLeftStyle'),
        borderInlineStartStyle: P.borderStyles('borderInlineStartStyle'),
        borderRightWidth: P.borderWidths('borderRightWidth'),
        borderInlineEndWidth: P.borderWidths('borderInlineEndWidth'),
        borderRightColor: P.colors('borderRightColor'),
        borderInlineEndColor: P.colors('borderInlineEndColor'),
        borderRightStyle: P.borderStyles('borderRightStyle'),
        borderInlineEndStyle: P.borderStyles('borderInlineEndStyle'),
        borderTopRadius: P.radii(['borderTopLeftRadius', 'borderTopRightRadius']),
        borderBottomRadius: P.radii(['borderBottomLeftRadius', 'borderBottomRightRadius']),
        borderLeftRadius: P.radii(['borderTopLeftRadius', 'borderBottomLeftRadius']),
        borderRightRadius: P.radii(['borderTopRightRadius', 'borderBottomRightRadius']),
      };
      Object.assign(C, {
        rounded: C.borderRadius,
        roundedTop: C.borderTopRadius,
        roundedTopLeft: C.borderTopLeftRadius,
        roundedTopRight: C.borderTopRightRadius,
        roundedTopStart: C.borderStartStartRadius,
        roundedTopEnd: C.borderStartEndRadius,
        roundedBottom: C.borderBottomRadius,
        roundedBottomLeft: C.borderBottomLeftRadius,
        roundedBottomRight: C.borderBottomRightRadius,
        roundedBottomStart: C.borderEndStartRadius,
        roundedBottomEnd: C.borderEndEndRadius,
        roundedLeft: C.borderLeftRadius,
        roundedRight: C.borderRightRadius,
        roundedStart: C.borderInlineStartRadius,
        roundedEnd: C.borderInlineEndRadius,
        borderStart: C.borderInlineStart,
        borderEnd: C.borderInlineEnd,
        borderTopStartRadius: C.borderStartStartRadius,
        borderTopEndRadius: C.borderStartEndRadius,
        borderBottomStartRadius: C.borderEndStartRadius,
        borderBottomEndRadius: C.borderEndEndRadius,
        borderStartRadius: C.borderInlineStartRadius,
        borderEndRadius: C.borderInlineEndRadius,
        borderStartWidth: C.borderInlineStartWidth,
        borderEndWidth: C.borderInlineEndWidth,
        borderStartColor: C.borderInlineStartColor,
        borderEndColor: C.borderInlineEndColor,
        borderStartStyle: C.borderInlineStartStyle,
        borderEndStyle: C.borderInlineEndStyle,
      });
      let E = {
          color: P.colors('color'),
          textColor: P.colors('color'),
          fill: P.colors('fill'),
          stroke: P.colors('stroke'),
          accentColor: P.colors('accentColor'),
          textFillColor: P.colors('textFillColor'),
        },
        R = {
          alignItems: !0,
          alignContent: !0,
          justifyItems: !0,
          justifyContent: !0,
          flexWrap: !0,
          flexDirection: { transform: T.flexDirection },
          flex: !0,
          flexFlow: !0,
          flexGrow: !0,
          flexShrink: !0,
          flexBasis: P.sizes('flexBasis'),
          justifySelf: !0,
          alignSelf: !0,
          order: !0,
          placeItems: !0,
          placeContent: !0,
          placeSelf: !0,
          gap: P.space('gap'),
          rowGap: P.space('rowGap'),
          columnGap: P.space('columnGap'),
        };
      Object.assign(R, { flexDir: R.flexDirection });
      let j = {
        width: P.sizesT('width'),
        inlineSize: P.sizesT('inlineSize'),
        height: P.sizes('height'),
        blockSize: P.sizes('blockSize'),
        boxSize: P.sizes(['width', 'height']),
        minWidth: P.sizes('minWidth'),
        minInlineSize: P.sizes('minInlineSize'),
        minHeight: P.sizes('minHeight'),
        minBlockSize: P.sizes('minBlockSize'),
        maxWidth: P.sizes('maxWidth'),
        maxInlineSize: P.sizes('maxInlineSize'),
        maxHeight: P.sizes('maxHeight'),
        maxBlockSize: P.sizes('maxBlockSize'),
        overflow: !0,
        overflowX: !0,
        overflowY: !0,
        overscrollBehavior: !0,
        overscrollBehaviorX: !0,
        overscrollBehaviorY: !0,
        display: !0,
        aspectRatio: !0,
        hideFrom: {
          scale: 'breakpoints',
          transform: (t, e) => {
            let r = e.__breakpoints?.get(t)?.minW ?? t;
            return { [`@media screen and (min-width: ${r})`]: { display: 'none' } };
          },
        },
        hideBelow: {
          scale: 'breakpoints',
          transform: (t, e) => {
            let r = e.__breakpoints?.get(t)?._minW ?? t;
            return { [`@media screen and (max-width: ${r})`]: { display: 'none' } };
          },
        },
        verticalAlign: !0,
        boxSizing: !0,
        boxDecorationBreak: !0,
        float: P.propT('float', T.float),
        objectFit: !0,
        objectPosition: !0,
        visibility: !0,
        isolation: !0,
      };
      Object.assign(j, {
        w: j.width,
        h: j.height,
        minW: j.minWidth,
        maxW: j.maxWidth,
        minH: j.minHeight,
        maxH: j.maxHeight,
        overscroll: j.overscrollBehavior,
        overscrollX: j.overscrollBehaviorX,
        overscrollY: j.overscrollBehaviorY,
      });
      let _ = {
          filter: { transform: T.filter },
          blur: P.blur('--chakra-blur'),
          brightness: P.propT('--chakra-brightness', T.brightness),
          contrast: P.propT('--chakra-contrast', T.contrast),
          hueRotate: P.propT('--chakra-hue-rotate', T.hueRotate),
          invert: P.propT('--chakra-invert', T.invert),
          saturate: P.propT('--chakra-saturate', T.saturate),
          dropShadow: P.propT('--chakra-drop-shadow', T.dropShadow),
          backdropFilter: { transform: T.backdropFilter },
          backdropBlur: P.blur('--chakra-backdrop-blur'),
          backdropBrightness: P.propT('--chakra-backdrop-brightness', T.brightness),
          backdropContrast: P.propT('--chakra-backdrop-contrast', T.contrast),
          backdropHueRotate: P.propT('--chakra-backdrop-hue-rotate', T.hueRotate),
          backdropInvert: P.propT('--chakra-backdrop-invert', T.invert),
          backdropSaturate: P.propT('--chakra-backdrop-saturate', T.saturate),
        },
        M = {
          ring: { transform: T.ring },
          ringColor: P.colors('--chakra-ring-color'),
          ringOffset: P.prop('--chakra-ring-offset-width'),
          ringOffsetColor: P.colors('--chakra-ring-offset-color'),
          ringInset: P.prop('--chakra-ring-inset'),
        },
        B = {
          appearance: !0,
          cursor: !0,
          resize: !0,
          userSelect: !0,
          pointerEvents: !0,
          outline: { transform: T.outline },
          outlineOffset: !0,
          outlineColor: P.colors('outlineColor'),
        },
        D = {
          gridGap: P.space('gridGap'),
          gridColumnGap: P.space('gridColumnGap'),
          gridRowGap: P.space('gridRowGap'),
          gridColumn: !0,
          gridRow: !0,
          gridAutoFlow: !0,
          gridAutoColumns: !0,
          gridColumnStart: !0,
          gridColumnEnd: !0,
          gridRowStart: !0,
          gridRowEnd: !0,
          gridAutoRows: !0,
          gridTemplate: !0,
          gridTemplateColumns: !0,
          gridTemplateRows: !0,
          gridTemplateAreas: !0,
          gridArea: !0,
        },
        L = ((t) => {
          let e = new WeakMap();
          return (r, i, n, o) => {
            if (void 0 === r) return t(r, i, n);
            e.has(r) || e.set(r, new Map());
            let a = e.get(r);
            if (a.has(i)) return a.get(i);
            let s = t(r, i, n, o);
            return a.set(i, s), s;
          };
        })(function (t, e, r, i) {
          let n = 'string' == typeof e ? e.split('.') : [e];
          for (i = 0; i < n.length && t; i += 1) t = t[n[i]];
          return void 0 === t ? r : t;
        }),
        O = {
          border: '0px',
          clip: 'rect(0, 0, 0, 0)',
          width: '1px',
          height: '1px',
          margin: '-1px',
          padding: '0px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          position: 'absolute',
        },
        V = {
          position: 'static',
          width: 'auto',
          height: 'auto',
          clip: 'auto',
          padding: '0',
          margin: '0',
          overflow: 'visible',
          whiteSpace: 'normal',
        },
        I = (t, e, r) => {
          let i = {},
            n = L(t, e, {});
          for (let t in n) (t in r && null != r[t]) || (i[t] = n[t]);
          return i;
        },
        $ = {
          position: !0,
          pos: P.prop('position'),
          zIndex: P.prop('zIndex', 'zIndices'),
          inset: P.spaceT('inset'),
          insetX: P.spaceT(['left', 'right']),
          insetInline: P.spaceT('insetInline'),
          insetY: P.spaceT(['top', 'bottom']),
          insetBlock: P.spaceT('insetBlock'),
          top: P.spaceT('top'),
          insetBlockStart: P.spaceT('insetBlockStart'),
          bottom: P.spaceT('bottom'),
          insetBlockEnd: P.spaceT('insetBlockEnd'),
          left: P.spaceT('left'),
          insetInlineStart: P.logical({ scale: 'space', property: { ltr: 'left', rtl: 'right' } }),
          right: P.spaceT('right'),
          insetInlineEnd: P.logical({ scale: 'space', property: { ltr: 'right', rtl: 'left' } }),
        };
      Object.assign($, { insetStart: $.insetInlineStart, insetEnd: $.insetInlineEnd });
      let F = {
        boxShadow: P.shadows('boxShadow'),
        mixBlendMode: !0,
        blendMode: P.prop('mixBlendMode'),
        backgroundBlendMode: !0,
        bgBlendMode: P.prop('backgroundBlendMode'),
        opacity: !0,
      };
      Object.assign(F, { shadow: F.boxShadow });
      let z = {
        margin: P.spaceT('margin'),
        marginTop: P.spaceT('marginTop'),
        marginBlockStart: P.spaceT('marginBlockStart'),
        marginRight: P.spaceT('marginRight'),
        marginInlineEnd: P.spaceT('marginInlineEnd'),
        marginBottom: P.spaceT('marginBottom'),
        marginBlockEnd: P.spaceT('marginBlockEnd'),
        marginLeft: P.spaceT('marginLeft'),
        marginInlineStart: P.spaceT('marginInlineStart'),
        marginX: P.spaceT(['marginInlineStart', 'marginInlineEnd']),
        marginInline: P.spaceT('marginInline'),
        marginY: P.spaceT(['marginTop', 'marginBottom']),
        marginBlock: P.spaceT('marginBlock'),
        padding: P.space('padding'),
        paddingTop: P.space('paddingTop'),
        paddingBlockStart: P.space('paddingBlockStart'),
        paddingRight: P.space('paddingRight'),
        paddingBottom: P.space('paddingBottom'),
        paddingBlockEnd: P.space('paddingBlockEnd'),
        paddingLeft: P.space('paddingLeft'),
        paddingInlineStart: P.space('paddingInlineStart'),
        paddingInlineEnd: P.space('paddingInlineEnd'),
        paddingX: P.space(['paddingInlineStart', 'paddingInlineEnd']),
        paddingInline: P.space('paddingInline'),
        paddingY: P.space(['paddingTop', 'paddingBottom']),
        paddingBlock: P.space('paddingBlock'),
      };
      Object.assign(z, {
        m: z.margin,
        mt: z.marginTop,
        mr: z.marginRight,
        me: z.marginInlineEnd,
        marginEnd: z.marginInlineEnd,
        mb: z.marginBottom,
        ml: z.marginLeft,
        ms: z.marginInlineStart,
        marginStart: z.marginInlineStart,
        mx: z.marginX,
        my: z.marginY,
        p: z.padding,
        pt: z.paddingTop,
        py: z.paddingY,
        px: z.paddingX,
        pb: z.paddingBottom,
        pl: z.paddingLeft,
        ps: z.paddingInlineStart,
        paddingStart: z.paddingInlineStart,
        pr: z.paddingRight,
        pe: z.paddingInlineEnd,
        paddingEnd: z.paddingInlineEnd,
      });
      let W = {
          scrollBehavior: !0,
          scrollSnapAlign: !0,
          scrollSnapStop: !0,
          scrollSnapType: !0,
          scrollMargin: P.spaceT('scrollMargin'),
          scrollMarginTop: P.spaceT('scrollMarginTop'),
          scrollMarginBottom: P.spaceT('scrollMarginBottom'),
          scrollMarginLeft: P.spaceT('scrollMarginLeft'),
          scrollMarginRight: P.spaceT('scrollMarginRight'),
          scrollMarginX: P.spaceT(['scrollMarginLeft', 'scrollMarginRight']),
          scrollMarginY: P.spaceT(['scrollMarginTop', 'scrollMarginBottom']),
          scrollPadding: P.spaceT('scrollPadding'),
          scrollPaddingTop: P.spaceT('scrollPaddingTop'),
          scrollPaddingBottom: P.spaceT('scrollPaddingBottom'),
          scrollPaddingLeft: P.spaceT('scrollPaddingLeft'),
          scrollPaddingRight: P.spaceT('scrollPaddingRight'),
          scrollPaddingX: P.spaceT(['scrollPaddingLeft', 'scrollPaddingRight']),
          scrollPaddingY: P.spaceT(['scrollPaddingTop', 'scrollPaddingBottom']),
        },
        N = {
          fontFamily: P.prop('fontFamily', 'fonts'),
          fontSize: P.prop('fontSize', 'fontSizes', T.px),
          fontWeight: P.prop('fontWeight', 'fontWeights'),
          lineHeight: P.prop('lineHeight', 'lineHeights'),
          letterSpacing: P.prop('letterSpacing', 'letterSpacings'),
          textAlign: !0,
          fontStyle: !0,
          textIndent: !0,
          wordBreak: !0,
          overflowWrap: !0,
          textOverflow: !0,
          textTransform: !0,
          whiteSpace: !0,
          isTruncated: {
            transform(t) {
              if (!0 === t)
                return { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
            },
          },
          noOfLines: {
            static: {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 'var(--chakra-line-clamp)',
            },
            property: '--chakra-line-clamp',
          },
        },
        U = {
          textDecorationColor: P.colors('textDecorationColor'),
          textDecoration: !0,
          textDecor: { property: 'textDecoration' },
          textDecorationLine: !0,
          textDecorationStyle: !0,
          textDecorationThickness: !0,
          textUnderlineOffset: !0,
          textShadow: P.shadows('textShadow'),
        },
        H = {
          clipPath: !0,
          transform: P.propT('transform', T.transform),
          transformOrigin: !0,
          translateX: P.spaceT('--chakra-translate-x'),
          translateY: P.spaceT('--chakra-translate-y'),
          skewX: P.degreeT('--chakra-skew-x'),
          skewY: P.degreeT('--chakra-skew-y'),
          scaleX: P.prop('--chakra-scale-x'),
          scaleY: P.prop('--chakra-scale-y'),
          scale: P.prop(['--chakra-scale-x', '--chakra-scale-y']),
          rotate: P.degreeT('--chakra-rotate'),
        },
        Y = i(
          {},
          A,
          C,
          E,
          R,
          j,
          _,
          M,
          B,
          D,
          {
            srOnly: { transform: (t) => (!0 === t ? O : 'focusable' === t ? V : {}) },
            layerStyle: { processResult: !0, transform: (t, e, r) => I(e, `layerStyles.${t}`, r) },
            textStyle: { processResult: !0, transform: (t, e, r) => I(e, `textStyles.${t}`, r) },
            apply: { processResult: !0, transform: (t, e, r) => I(e, t, r) },
          },
          $,
          F,
          z,
          W,
          N,
          U,
          H,
          {
            listStyleType: !0,
            listStylePosition: !0,
            listStylePos: P.prop('listStylePosition'),
            listStyleImage: !0,
            listStyleImg: P.prop('listStyleImage'),
          },
          {
            transition: !0,
            transitionDelay: !0,
            animation: !0,
            willChange: !0,
            transitionDuration: P.prop('transitionDuration', 'transition.duration'),
            transitionProperty: P.prop('transitionProperty', 'transition.property'),
            transitionTimingFunction: P.prop('transitionTimingFunction', 'transition.easing'),
          }
        ),
        X = Object.keys(Object.assign({}, z, j, R, D, $)),
        G = [...Object.keys(Y), ...n._],
        q = { ...Y, ...n.v },
        K = (t) => t in q;
    },
    9328: function (t, e, r) {
      'use strict';
      r.d(e, {
        L: function () {
          return n;
        },
      });
      var i = r(5670);
      function n(t) {
        return (0, i.C)(t, ['styleConfig', 'size', 'variant', 'colorScheme']);
      }
    },
    5885: function (t, e, r) {
      'use strict';
      r.d(e, {
        Y: function () {
          return u;
        },
        y: function () {
          return c;
        },
      });
      var i = r(1055);
      function n(t) {
        if (null == t) return t;
        let { unitless: e } = (function (t) {
          let e = parseFloat(t.toString()),
            r = t.toString().replace(String(e), '');
          return { unitless: !r, value: e, unit: r };
        })(t);
        return e || 'number' == typeof t ? `${t}px` : t;
      }
      let o = (t, e) => (parseInt(t[1], 10) > parseInt(e[1], 10) ? 1 : -1),
        a = (t) => Object.fromEntries(Object.entries(t).sort(o));
      function s(t) {
        let e = a(t);
        return Object.assign(Object.values(e), e);
      }
      function l(t) {
        return t
          ? 'number' == typeof (t = n(t) ?? t)
            ? `${t + -0.02}`
            : t.replace(/(\d+\.?\d*)/u, (t) => `${parseFloat(t) + -0.02}`)
          : t;
      }
      function u(t, e) {
        let r = ['@media screen'];
        return (
          t && r.push('and', `(min-width: ${n(t)})`),
          e && r.push('and', `(max-width: ${n(e)})`),
          r.join(' ')
        );
      }
      function c(t) {
        if (!t) return null;
        t.base = t.base ?? '0px';
        let e = s(t),
          r = Object.entries(t)
            .sort(o)
            .map(([t, e], r, i) => {
              let [, n] = i[r + 1] ?? [];
              return (
                (n = parseFloat(n) > 0 ? l(n) : void 0),
                {
                  _minW: l(e),
                  breakpoint: t,
                  minW: e,
                  maxW: n,
                  maxWQuery: u(null, n),
                  minWQuery: u(e),
                  minMaxQuery: u(e, n),
                }
              );
            }),
          n = new Set(Object.keys(a(t))),
          c = Array.from(n.values());
        return {
          keys: n,
          normalized: e,
          isResponsive(t) {
            let e = Object.keys(t);
            return e.length > 0 && e.every((t) => n.has(t));
          },
          asObject: a(t),
          asArray: s(t),
          details: r,
          get: (t) => r.find((e) => e.breakpoint === t),
          media: [null, ...e.map((t) => u(t)).slice(1)],
          toArrayValue(t) {
            if (!(0, i.Kn)(t)) throw Error('toArrayValue: value must be an object');
            let e = c.map((e) => t[e] ?? null);
            for (
              ;
              null ===
              (function (t) {
                let e = null == t ? 0 : t.length;
                return e ? t[e - 1] : void 0;
              })(e);

            )
              e.pop();
            return e;
          },
          toObjectValue(t) {
            if (!Array.isArray(t)) throw Error('toObjectValue: value must be an array');
            return t.reduce((t, e, r) => {
              let i = c[r];
              return null != i && null != e && (t[i] = e), t;
            }, {});
          },
        };
      }
    },
    7861: function (t, e, r) {
      'use strict';
      function i(t) {
        let e = Object.assign({}, t);
        for (let t in e) void 0 === e[t] && delete e[t];
        return e;
      }
      r.d(e, {
        o: function () {
          return i;
        },
      });
    },
    5938: function (t, e, r) {
      'use strict';
      r.d(e, {
        k: function () {
          return n;
        },
      });
      var i = r(8867);
      function n() {
        let t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
          {
            name: e,
            strict: r = !0,
            hookName: n = 'useContext',
            providerName: o = 'Provider',
            errorMessage: a,
            defaultValue: s,
          } = t,
          l = (0, i.createContext)(s);
        return (
          (l.displayName = e),
          [
            l.Provider,
            function t() {
              let e = (0, i.useContext)(l);
              if (!e && r) {
                var s, u;
                let e = Error(
                  null != a
                    ? a
                    : ''
                        .concat(
                          n,
                          ' returned `undefined`. Seems you forgot to wrap component within '
                        )
                        .concat(o)
                );
                throw (
                  ((e.name = 'ContextError'),
                  null === (s = (u = Error).captureStackTrace) || void 0 === s || s.call(u, e, t),
                  e)
                );
              }
              return e;
            },
            l,
          ]
        );
      }
    },
    8380: function (t, e, r) {
      'use strict';
      r.d(e, {
        cx: function () {
          return i;
        },
      });
      let i = (...t) => t.filter(Boolean).join(' ');
    },
    6506: function (t, e, r) {
      'use strict';
      r.d(e, {
        W: function () {
          return i;
        },
      });
      let i = ((t) => {
        let e = new WeakMap();
        return (r, i, n, o) => {
          if (void 0 === r) return t(r, i, n);
          e.has(r) || e.set(r, new Map());
          let a = e.get(r);
          if (a.has(i)) return a.get(i);
          let s = t(r, i, n, o);
          return a.set(i, s), s;
        };
      })(function (t, e, r, i) {
        let n = 'string' == typeof e ? e.split('.') : [e];
        for (i = 0; i < n.length && t; i += 1) t = t[n[i]];
        return void 0 === t ? r : t;
      });
    },
    1055: function (t, e, r) {
      'use strict';
      function i(t) {
        return Array.isArray(t);
      }
      function n(t) {
        let e = typeof t;
        return null != t && ('object' === e || 'function' === e) && !i(t);
      }
      r.d(e, {
        Kn: function () {
          return n;
        },
        kJ: function () {
          return i;
        },
      });
    },
    5670: function (t, e, r) {
      'use strict';
      function i(t, e = []) {
        let r = Object.assign({}, t);
        for (let t of e) t in r && delete r[t];
        return r;
      }
      r.d(e, {
        C: function () {
          return i;
        },
      });
    },
    3075: function (t, e, r) {
      'use strict';
      r.d(e, {
        P: function () {
          return n;
        },
      });
      let i = (t) => 'function' == typeof t;
      function n(t, ...e) {
        return i(t) ? t(...e) : t;
      }
    },
  },
]);
