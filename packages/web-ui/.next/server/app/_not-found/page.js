(() => {
  var e = {};
  (e.id = 409),
    (e.ids = [409]),
    (e.modules = {
      2934: (e) => {
        'use strict';
        e.exports = require('next/dist/client/components/action-async-storage.external.js');
      },
      4580: (e) => {
        'use strict';
        e.exports = require('next/dist/client/components/request-async-storage.external.js');
      },
      5869: (e) => {
        'use strict';
        e.exports = require('next/dist/client/components/static-generation-async-storage.external.js');
      },
      399: (e) => {
        'use strict';
        e.exports = require('next/dist/compiled/next-server/app-page.runtime.prod.js');
      },
      1636: (e, t, r) => {
        'use strict';
        r.r(t),
          r.d(t, {
            GlobalError: () => s.a,
            __next_app__: () => f,
            originalPathname: () => c,
            pages: () => u,
            routeModule: () => p,
            tree: () => d,
          }),
          r(2858),
          r(86),
          r(9690);
        var n = r(6595),
          o = r(6292),
          i = r(5557),
          s = r.n(i),
          l = r(8265),
          a = {};
        for (let e in l)
          0 >
            [
              'default',
              'tree',
              'pages',
              'GlobalError',
              'originalPathname',
              '__next_app__',
              'routeModule',
            ].indexOf(e) && (a[e] = () => l[e]);
        r.d(t, a);
        let d = [
            '',
            {
              children: [
                '/_not-found',
                {
                  children: [
                    '__PAGE__',
                    {},
                    {
                      page: [
                        () => Promise.resolve().then(r.t.bind(r, 86, 23)),
                        'next/dist/client/components/not-found-error',
                      ],
                    },
                  ],
                },
                {},
              ],
            },
            {
              layout: [
                () => Promise.resolve().then(r.bind(r, 9690)),
                '/Users/sam/code/github.com/samjwillis97/ai-testing/main/packages/web-ui/src/app/layout.tsx',
              ],
              'not-found': [
                () => Promise.resolve().then(r.t.bind(r, 86, 23)),
                'next/dist/client/components/not-found-error',
              ],
            },
          ],
          u = [],
          c = '/_not-found/page',
          f = { require: r, loadChunk: () => Promise.resolve() },
          p = new n.AppPageRouteModule({
            definition: {
              kind: o.x.APP_PAGE,
              page: '/_not-found/page',
              pathname: '/_not-found',
              bundlePath: '',
              filename: '',
              appPaths: [],
            },
            userland: { loaderTree: d },
          });
      },
      3709: (e, t, r) => {
        Promise.resolve().then(r.t.bind(r, 3750, 23)),
          Promise.resolve().then(r.t.bind(r, 4110, 23)),
          Promise.resolve().then(r.t.bind(r, 8921, 23)),
          Promise.resolve().then(r.t.bind(r, 2444, 23)),
          Promise.resolve().then(r.t.bind(r, 7106, 23)),
          Promise.resolve().then(r.t.bind(r, 7825, 23));
      },
      4414: (e, t, r) => {
        Promise.resolve().then(r.bind(r, 5351));
      },
      5351: (e, t, r) => {
        'use strict';
        r.d(t, { Providers: () => a });
        var n = r(9015),
          o = r(721),
          i = r(1466),
          s = r(8603);
        let l = (0, r(2360).B1)({
          config: { initialColorMode: 'system', useSystemColorMode: !0 },
          styles: {
            global: {
              body: {
                bg: 'gray.50',
                color: 'gray.800',
                _dark: { bg: 'gray.900', color: 'gray.100' },
              },
            },
          },
        });
        function a({ children: e }) {
          return n.jsx(s.n, {
            children: (0, n.jsxs)(o.x, {
              theme: l,
              children: [n.jsx(i.Z, { initialColorMode: l.config.initialColorMode }), e],
            }),
          });
        }
      },
      4157: (e, t) => {
        'use strict';
        Object.defineProperty(t, '__esModule', { value: !0 }),
          (function (e, t) {
            for (var r in t) Object.defineProperty(e, r, { enumerable: !0, get: t[r] });
          })(t, {
            isNotFoundError: function () {
              return o;
            },
            notFound: function () {
              return n;
            },
          });
        let r = 'NEXT_NOT_FOUND';
        function n() {
          let e = Error(r);
          throw ((e.digest = r), e);
        }
        function o(e) {
          return 'object' == typeof e && null !== e && 'digest' in e && e.digest === r;
        }
        ('function' == typeof t.default || ('object' == typeof t.default && null !== t.default)) &&
          void 0 === t.default.__esModule &&
          (Object.defineProperty(t.default, '__esModule', { value: !0 }),
          Object.assign(t.default, t),
          (e.exports = t.default));
      },
      2858: (e, t, r) => {
        'use strict';
        Object.defineProperty(t, '__esModule', { value: !0 }),
          (function (e, t) {
            for (var r in t) Object.defineProperty(e, r, { enumerable: !0, get: t[r] });
          })(t, {
            PARALLEL_ROUTE_DEFAULT_PATH: function () {
              return o;
            },
            default: function () {
              return i;
            },
          });
        let n = r(4157),
          o = 'next/dist/client/components/parallel-route-default.js';
        function i() {
          (0, n.notFound)();
        }
        ('function' == typeof t.default || ('object' == typeof t.default && null !== t.default)) &&
          void 0 === t.default.__esModule &&
          (Object.defineProperty(t.default, '__esModule', { value: !0 }),
          Object.assign(t.default, t),
          (e.exports = t.default));
      },
      9690: (e, t, r) => {
        'use strict';
        r.r(t), r.d(t, { default: () => s, metadata: () => i });
        var n = r(4982);
        let o = (0, r(4786).createProxy)(
            String.raw`/Users/sam/code/github.com/samjwillis97/ai-testing/main/packages/web-ui/src/app/providers.js#Providers`
          ),
          i = {
            title: "Sam's HTTP Client",
            description: 'A versatile, pluggable HTTP client application',
          };
        function s({ children: e }) {
          return n.jsx('html', {
            lang: 'en',
            children: n.jsx('body', { children: n.jsx(o, { children: e }) }),
          });
        }
      },
    });
  var t = require('../../webpack-runtime.js');
  t.C(e);
  var r = (e) => t((t.s = e)),
    n = t.X(0, [261], () => r(1636));
  module.exports = n;
})();
