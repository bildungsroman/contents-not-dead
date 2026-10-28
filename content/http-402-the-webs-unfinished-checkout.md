---
title: HTTP 402 and the Web's Unfinished Checkout
summary: Payment Required has occupied a place in HTTP for three decades without defining how a payment should work. Its empty history explains both the early web's ambitions and its limits.
authors: [The Editors]
date: '2026-10-25'
tags: [http, web-history, payments]
type: article
access: paid
---

Between `401 Unauthorized` and `403 Forbidden`, HTTP leaves a space for a
different answer:

`402 Payment Required`

The name sounds complete. It suggests that the web has always had a native
payment protocol waiting to be activated. A server names a price, a browser
pays it, and the requested page appears.

That is not what 402 is.

It is a status code, not a payment protocol. The modern HTTP specification
still describes it with one sentence:

> The 402 (Payment Required) status code is reserved for future use.

The interesting history is how a concrete early idea became that empty
reservation—and why the problem it names has returned in an internet where
software agents, not only people, request services.

## HTTP began without a checkout

The earliest web protocol was deliberately small. A client connected to a
server, sent a request such as `GET /document`, and received the document.
What is now called HTTP/0.9 had one method, no request headers, and no numeric
status codes in the response.

As the web expanded beyond a collection of linked research documents, HTTP
gained metadata, content types, caching, authentication, redirects, and error
responses. Status codes divided outcomes into families: `2xx` for success,
`3xx` for redirection, `4xx` for a problem associated with the client request,
and `5xx` for a server failure.

Payment appeared in this design space early. An
[old W3C description of HTTP responses](https://www.w3.org/Protocols/HTTP/HTRESP.html)
listed `402 PaymentRequired` and imagined that the response would identify
acceptable charging schemes. A client could retry with a `ChargeTo` header,
just as a client receiving `401` could retry with authorization.

That description contained the germ of an elegant interaction:

1. request a resource;
2. learn that it has a price;
3. attach payment;
4. repeat the request;
5. receive the resource.

The status code alone could not supply the missing details. How was the price
represented? Which currencies and payment systems could be offered? How could
a client know whom it was paying? What counted as proof? Could a retry charge
twice? HTTP needed a payment vocabulary around 402.

## A 1995 proposal tried to supply the rest

In July 1995, Donald Eastlake circulated an
[Internet Payment Framework draft](https://lists.w3.org/Archives/Public/ietf-http-wg/1995JulSep/0008.html)
to the IETF HTTP working group. It proposed a common syntax that could support
multiple payment systems across the web and other internet protocols.

For HTTP, the draft described:

- `COST` parameters that could advertise a link or form action’s price;
- a `ChargeTo` header carrying payment with a request;
- a `Receipt` header reporting collection or adjustment;
- a `402 Payment Required` response when a request arrived without enough
  payment;
- a `www-cost` response header, analogous to `www-authenticate`, describing
  acceptable payment options.

The proposal even warned clients not to send fresh money when automatically
retrying a request. They should resend the same payment so a transient network
failure did not become a duplicate charge. That is a recognizable concern in
modern payment APIs: retries need idempotency.

Eastlake’s draft is evidence that early web engineers did more than leave a
number in a list. They explored a real protocol shape. But it remained an
Internet-Draft, not an adopted standard.

The final HTTP/1.0 specification, RFC 1945, did not define 402. When the first
HTTP/1.1 standard, RFC 2068, was published in January 1997, the code appeared
with only the statement
[“This code is reserved for future use.”](https://www.rfc-editor.org/rfc/rfc2068.html#section-10.4.3)

The charging headers and retry procedure were gone. HTTP kept the sign on the
door but did not build the room behind it.

## The 1990s had no shortage of digital money

The omission did not reflect a lack of payment experiments. The early
commercial internet produced electronic-cash companies, encrypted card
systems, stored-value schemes, and proposals designed specifically for tiny
purchases.

Digital Equipment Corporation’s Millicent, for example, used low-value
merchant-specific scrip so that a customer would not need an expensive bank
operation for every article, quote, or image. Other projects included IBM’s
MiniPay and systems associated with DigiCash, CyberCash, and First Virtual.

In 1998, the World Wide Web Consortium organized a micropayments meeting. Its
[announcement](https://www.w3.org/ECommerce/Micropayments/micropay-announce.html)
listed proposals from DEC, IBM, France Télécom, and Eastlake’s work. The goal
was to determine whether a W3C working group could produce a shared
specification.

The list reveals both energy and fragmentation. Each design made different
choices about wallets, brokers, merchant accounts, anonymity, settlement, and
risk. HTTP could name the moment at which payment was required, but it could
not make incompatible money systems interoperate.

## Why micropayments did not become a browser primitive

The common explanation is that transaction fees made tiny payments
uneconomical. That was important, but incomplete.

A universal web payment system had to solve several problems at once:

**Enrollment.** A reader needed a funded wallet or an account with a payment
provider before the first purchase.

**Interoperability.** A browser and a publisher had to support at least one
payment method in common.

**Trust.** The client needed confidence that the named merchant controlled the
site and would deliver what it promised.

**Privacy.** A payment could identify a reader more reliably than a cookie.
Designs disagreed about what merchants, brokers, and banks should learn.

**Disputes and refunds.** Information could be delivered instantly and could
not be “returned” in the ordinary sense. Fraud, accidental purchases, and
misleading descriptions still needed remedies.

**Mental cost.** Even if a payment of one cent was technically efficient,
deciding whether every link was worth one cent could make browsing feel like
operating a parking meter.

**Merchant economics.** Publishers needed enough paying readers to justify
integration, while readers needed enough participating publishers to justify
setting up a wallet.

Conventional web commerce solved a narrower problem. Secure connections and
HTML forms allowed stores to collect card details for purchases large enough
to bear existing payment costs. Payment processors simplified merchant
integration. The checkout page became an application built *on* HTTP rather
than a feature *of* HTTP.

For low-value information, the web mostly chose other bundles. Advertising
aggregated many page views into a revenue stream. Subscriptions aggregated
many articles into one recurring payment. Both avoided asking the browser to
negotiate a price for each request, although both introduced their own costs in
tracking, attention, lock-in, and account management.

## A reserved code acquires unofficial meanings

Because 402 never received standard behavior, developers have used it in
different ways. Some APIs return it when an account has insufficient funds or
an expired subscription. Others use it for a failed card payment, a quota
limit, or a store whose bill is overdue.

Those responses may be understandable within one API, but they do not create
interoperability. A generic client cannot look at an arbitrary 402 response
and know:

- the price;
- the asset or service being sold;
- the available payment methods;
- where to obtain a credential;
- how to present that credential;
- whether a retry is safe;
- what receipt to expect.

[MDN’s current reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402)
therefore describes 402 as reserved and not defined. Browsers treat it as a
generic `4xx` error. The current HTTP semantics standard,
[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-402-payment-required),
continues to reserve it rather than blessing one of the incompatible uses.

Reservation can look like failure. It can also be restraint. Standardizing a
vague or premature payment mechanism would have made it harder to replace.

## Agents change the interface problem

For a person, an ordinary checkout page is cumbersome but usable. A browser
displays a form. The person reads it, enters information, passes any fraud
checks, and clicks a button.

Software agents make that fallback less satisfactory. An agent fetching a
dataset, purchasing an API result, or paying to read an article needs a
machine-readable challenge. It cannot reliably interpret every visual
checkout, agree to arbitrary terms, or receive unrestricted access to a
person’s card.

Agents also make per-use pricing more attractive. A person may not want to
create an account and subscription for one document. An agent can compare a
clearly stated price with a budget policy, obtain narrowly delegated payment
authority, pay, preserve the receipt, and continue—provided the protocol is
consistent.

That renewed interest has produced modern approaches to payment over HTTP.
Some use cryptocurrency payment proofs. Some use wallets connected to browser
or application identity. The Machine Payments Protocol, or MPP, follows the
authentication-shaped exchange that early proposals anticipated:

1. a server responds with `402` and a `WWW-Authenticate: Payment` challenge;
2. the client satisfies one of the offered payment methods;
3. it retries with an `Authorization: Payment` credential;
4. the server verifies payment and returns the resource with a receipt.

MPP is one proposal for filling the space around 402, not a meaning supplied by
HTTP itself. The distinction matters. The status code says *payment is
required*. A payment protocol must define everything needed to act on that
statement.

The companion article
[“Can MPP Save Content Creators?”](/post/making-agents-pay) examines that model
from a publisher’s perspective. The history here suggests a harder standard:
any new system must solve not only transport, but also authority, privacy,
retries, receipts, and enough interoperability to escape a single vendor or
wallet.

## The value of an unfinished feature

HTTP succeeded partly because it did not attempt to standardize every
application built with it. The web could support stores without making a card
network part of the browser protocol. That separation enabled rapid commerce,
even as it left micropayments, subscriptions, and paywalls fragmented.

The blankness of 402 captures that tradeoff.

Early designers correctly anticipated that a client might need to pay before a
server fulfilled a request. They also discovered that naming the condition was
much easier than standardizing digital money. The number survived while
wallets, currencies, business models, and security assumptions changed around
it.

Three decades later, the question is no longer whether HTTP can carry a
payment. It always could. The question is whether clients and servers can share
a safe, legible way to negotiate one without rebuilding checkout for every
resource.

`402 Payment Required` is not a protocol left dormant in the web’s source
code. It is a placeholder for an agreement the web has not yet managed to
make.
