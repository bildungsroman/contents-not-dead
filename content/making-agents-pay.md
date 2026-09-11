---
title: Can MPP Save Content Creators?
summary: "For 30 years we paid for content with our attention, and the ads only got more intrusive. The Machine Payments Protocol revives HTTP's forgotten 402 status code so creators get paid in money instead."
authors: [The Editors]
date: '2026-09-30'
tags: [mpp, content]
type: article
---

Is content dead? That's the central premise of this site, and we'd like to argue that it's not. But it has run into a huge impediment: people are tired of paying for content with their attention, and machines have been scraping and using content without paying for years now. In that reality, what incentives do creators have to share their art or writing with the world?

There may be a way forward, however: the same technology that has led to the web being increasingly scoured by agentic traffic may bring about a way for both machines and humans to fairly and consistently pay for the content they consume.

## The curious case of 402

Back when the Internet was being conceived and HTTP status codes were being planned, right between 401 Unauthorized and 403 Forbidden sat 402 Payment Required. Unlike the other two, its status was initially "Reserved for future use". It remained that way for over 30 years.

When Tim Berners-Lee and other early web pioneers mapped out the 4xx client error family in the 1990s, they foresaw an internet built heavily on digital cash and frictionless web economies - what we now know as micropayments. They reserved 402 specifically to act as a native protocol layer for micropayments, but that never materialized. Instead, we got ads - pop-up, sidebar, or otherwise - in an increasingly intrusive fashion meant to grab attention away from the content being served.

That has been the state of web and mobile content for the past 30+ years, with the 402 status being largely unutilized - until very recently. Now that agents have become consumers of content, there's a potential to make use of this forgotten protocol to allow content creators to receive payments in money, and not attention.

## Machines begin making payments

So how can the 402 status code be used to charge and pay for content? One way is through the Machine Payment Protocol (MPP), a system specifically designed for machine-to-machine micropayments.

Traditional payment systems (like credit cards or bank transfers) were built for humans, requiring forms, manual checkouts, and security checks. The problem arose in the past few years, when humans began sharing the web with AI agents as consumers of data. Agents cannot open credit cards, fill out checkout forms, or sign up for recurring monthly subscriptions. If content is behind a paywall, they either had to find a free workaround or have no way to access that content - until now.

## How MPP works

The [Machine Payments Protocol](https://stripe.com/blog/machine-payments-protocol) is an open-source payment protocol co-authored by Stripe and the Tempo blockchain network. MPP allows payment by both crypto rails like USDC as well as traditional payment methods such as credit cards or "Buy Now, Pay Later" (BNPL) options that don't require a crypto wallet. This is achieved using Shared Payment Tokens (SPTs), which are scoped, delegated digital tokens that allow an agent to safely charge a user's payment method within set guardrails.

Here's how an MPP request/response flow works in practice:

![An MPP request/response flow](/content/assets/MPP-diagram.png)

MPP integrates directly into the standard HTTP Authentication framework using standard web headers. An MPP interaction mirrors basic web logins: 
1. **Challenge**: Server returns a `402` with `WWW-Authenticate: Payment [Details]`
2. **Retry**: Agent pays and retries the request with `Authorization: Payment [Credential]`
3. **Receipt**: Server verifies and returns a `200 OK` along with a `Payment-Receipt` header

## Making agents pay (for content)

For content creators, using the 402 status code means that their content remains behind a paywall for agents - but it's a paywall that does not require a subscription or a checkout form. Meanwhile, their human readers can access this same content via a subscription, or get their agents to pay a one-time fee for access.

Because MPP is integrated directly into Stripe's `PaymentIntents` API, any website can use Stripe to accept programmatic machine payments with just [a few lines of code](https://docs.stripe.com/payments/machine/mpp).

## The future of 402

There's a premise behind the 402 status that has not been explored yet: **MPP eliminates the need for authentication**.

Imagine a world where rather than having a subscription (and thus a login) to 10 different publications, like _The New York Times_, _Wired_, several Substacks, etc., instead your have a reader application that is linked to your wallet (say, a [Link Wallet for agents](https://link.com/agents) or Apple Pay). You run across an interesting article you want to read, the article page returns a 402, and your wallet is automatically charged through your agent as it fetches the content of the article and puts it in your app.

This is a win-win for readers and content creators: readers no longer have to juggle potentially dozens of identities and subscriptions, and content creators get paid for every piece they produce that someone accesses, whether it's a human or a machine. In this future, content is alive and well.
