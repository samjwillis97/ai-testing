(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [185],
  {
    243: function (o, e, n) {
      Promise.resolve().then(n.bind(n, 495));
    },
    495: function (o, e, n) {
      'use strict';
      n.d(e, {
        Providers: function () {
          return c;
        },
      });
      var r = n(8219),
        i = n(5766),
        t = n(5106),
        l = n(8484);
      let s = (0, n(2677).B1)({
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
      function c(o) {
        let { children: e } = o;
        return (0, r.jsx)(l.n, {
          children: (0, r.jsxs)(i.x, {
            theme: s,
            children: [(0, r.jsx)(t.Z, { initialColorMode: s.config.initialColorMode }), e],
          }),
        });
      }
    },
  },
  function (o) {
    o.O(0, [118, 592, 589, 987, 744], function () {
      return o((o.s = 243));
    }),
      (_N_E = o.O());
  },
]);
