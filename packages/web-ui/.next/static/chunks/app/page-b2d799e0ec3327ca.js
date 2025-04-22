(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [931],
  {
    9430: function (e, t, n) {
      Promise.resolve().then(n.bind(n, 9771));
    },
    9771: function (e, t, n) {
      'use strict';
      n.r(t),
        n.d(t, {
          default: function () {
            return b;
          },
        });
      var s = n(8219),
        r = n(7627),
        i = n(523),
        a = n(6794),
        l = n(2027),
        o = n(8867),
        c = n(709),
        u = n(9222),
        h = n(5352),
        p = n(8788),
        d = n(8084),
        x = n(591),
        m = n(7339),
        f = n(5205),
        j = n(9082);
      class g extends j.Z {
        async request(e) {
          let t = Date.now();
          try {
            for (let t of ((e = this.applyEnvironment(e)), this.plugins))
              t.onRequest && (e = await t.onRequest(e));
            let n = {
              ...(await this.axios.request(e)),
              duration: Date.now() - t,
              timestamp: new Date(),
            };
            for (let e of this.plugins) e.onResponse && (await e.onResponse(n));
            return this.emit('response', n), n;
          } catch (t) {
            let e = t instanceof Error ? t : Error(String(t));
            for (let t of this.plugins) t.onError && (await t.onError(e));
            throw (this.emit('error', e), e);
          }
        }
        use(e) {
          this.plugins.push(e), this.emit('plugin:added', e);
        }
        setEnvironment(e) {
          (this.currentEnvironment = e),
            e.baseUrl && (this.axios = f.Z.create({ baseURL: e.baseUrl })),
            this.emit('environment:changed', e);
        }
        applyEnvironment(e) {
          if (!this.currentEnvironment) return e;
          let { variables: t } = this.currentEnvironment,
            n = { ...e };
          if (e.environmentVariables) {
            let s = e.headers || {};
            Object.entries(e.environmentVariables).forEach((e) => {
              let [n, r] = e;
              if ('string' == typeof r) {
                let e = r;
                Object.entries(t).forEach((t) => {
                  let [n, s] = t;
                  e = e.replace('${'.concat(n, '}'), String(s));
                }),
                  (s[n] = e);
              }
            }),
              (n.headers = s),
              delete n.environmentVariables;
          }
          return n;
        }
        constructor(e) {
          super(), (this.plugins = []), (this.axios = f.Z.create(e));
        }
      }
      let v = new g();
      function E() {
        let [e, t] = (0, o.useState)('GET'),
          [n, r] = (0, o.useState)(''),
          [a, f] = (0, o.useState)(''),
          [j, g] = (0, o.useState)(''),
          E = (0, c.p)(),
          b = async (t) => {
            t.preventDefault();
            try {
              let t = j
                  ? Object.fromEntries(
                      j.split('\n').map((e) => {
                        let [t, n] = e.split(':').map((e) => e.trim());
                        return [t, n];
                      })
                    )
                  : {},
                s = await v.request({
                  method: e,
                  url: n,
                  headers: t,
                  data: a ? JSON.parse(a) : void 0,
                });
              E({
                title: 'Request successful',
                description: 'Status: '.concat(s.status),
                status: 'success',
                duration: 5e3,
                isClosable: !0,
              });
            } catch (e) {
              E({
                title: 'Request failed',
                description: e instanceof Error ? e.message : 'Unknown error',
                status: 'error',
                duration: 5e3,
                isClosable: !0,
              });
            }
          };
        return (0, s.jsx)(l.x, {
          as: 'form',
          onSubmit: b,
          children: (0, s.jsxs)(i.g, {
            spacing: 4,
            align: 'stretch',
            children: [
              (0, s.jsxs)(u.NI, {
                children: [
                  (0, s.jsx)(h.l, { children: 'Method' }),
                  (0, s.jsxs)(p.P, {
                    value: e,
                    onChange: (e) => t(e.target.value),
                    children: [
                      (0, s.jsx)('option', { value: 'GET', children: 'GET' }),
                      (0, s.jsx)('option', { value: 'POST', children: 'POST' }),
                      (0, s.jsx)('option', { value: 'PUT', children: 'PUT' }),
                      (0, s.jsx)('option', { value: 'DELETE', children: 'DELETE' }),
                      (0, s.jsx)('option', { value: 'PATCH', children: 'PATCH' }),
                    ],
                  }),
                ],
              }),
              (0, s.jsxs)(u.NI, {
                children: [
                  (0, s.jsx)(h.l, { children: 'URL' }),
                  (0, s.jsx)(d.I, {
                    type: 'url',
                    value: n,
                    onChange: (e) => r(e.target.value),
                    placeholder: 'https://api.example.com/endpoint',
                  }),
                ],
              }),
              (0, s.jsxs)(u.NI, {
                children: [
                  (0, s.jsx)(h.l, { children: 'Headers (one per line, key: value)' }),
                  (0, s.jsx)(x.g, {
                    value: j,
                    onChange: (e) => g(e.target.value),
                    placeholder: 'Content-Type: application/json',
                  }),
                ],
              }),
              (0, s.jsxs)(u.NI, {
                children: [
                  (0, s.jsx)(h.l, { children: 'Body (JSON)' }),
                  (0, s.jsx)(x.g, {
                    value: a,
                    onChange: (e) => f(e.target.value),
                    placeholder: '{}',
                  }),
                ],
              }),
              (0, s.jsx)(m.z, { type: 'submit', colorScheme: 'blue', children: 'Send Request' }),
            ],
          }),
        });
      }
      function b() {
        return (0, s.jsx)(r.W, {
          maxW: 'container.xl',
          py: 8,
          children: (0, s.jsxs)(i.g, {
            spacing: 8,
            align: 'stretch',
            children: [
              (0, s.jsx)(a.X, {
                as: 'h1',
                size: 'xl',
                textAlign: 'center',
                children: "Sam's HTTP Client",
              }),
              (0, s.jsx)(l.x, { children: (0, s.jsx)(E, {}) }),
            ],
          }),
        });
      }
    },
  },
  function (e) {
    e.O(0, [118, 908, 589, 987, 744], function () {
      return e((e.s = 9430));
    }),
      (_N_E = e.O());
  },
]);
