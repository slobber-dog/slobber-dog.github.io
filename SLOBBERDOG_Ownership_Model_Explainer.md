<p align="center">
  <img src="assets/slobberdog-logo.png" alt="SLOBBERDOG" width="360">
</p>

# SLOBBERDOG Ownership Model Explainer

**How SLOBBERDOG builds client systems without making ownership weird**  
**Version:** 1.2
**Date:** 18 February 2026

---

## The short version

You own your stuff. SLOBBERDOG owns its engine. Third-party platforms own theirs.

You get the access and rights needed to use the system we build for the agreed purpose. If you want exclusive access, source code, self-hosting, white-labelling or ownership of the underlying platform, that is a separate commercial deal.

---

## Why we separate the layers

Most AI and automation projects are not built from nothing. They combine client-specific knowledge, reusable technical infrastructure, public tools, model APIs, automation glue, custom configuration and human review.

If we pretend all of that is one undifferentiated blob called “the product”, ownership gets messy quickly.

SLOBBERDOG separates the work into three layers so everyone knows what belongs to whom, what can be reused, and what is simply being accessed under another provider’s terms.

---

## The three-layer model

| Layer | Plain-English meaning | Default position |
|---|---|---|
| **1. Project Layer** | Your materials, your context, your confidential information, your internal requirements, your project-specific setup and the outputs created for your use. | Yours, subject to third-party terms and whatever rights SLOBBERDOG can legally give you. |
| **2. SLOBBERDOG Core Technology Layer** | The reusable engine underneath: agents, automations, orchestration logic, workflows, code, templates, APIs, dashboards, testing systems and general methods. | SLOBBERDOG’s. You get access or a licence as needed to use the project. |
| **3. Third-Party Services Layer** | Public or commercial tools we connect to: model APIs, image/music/video tools, cloud platforms, automation services, storage, monitoring and other providers. | The provider’s. Use depends on their terms, pricing and availability. |

---

## What belongs to you

The project-specific layer belongs to you.

This includes:

- your confidential inputs, scripts, briefs, footage, audio, data, production context, brand assets, internal requirements and business information;
- your company-specific workflow configuration, approval structures, naming conventions, routing rules, task instructions and metadata rules;
- project documents, reports, final outputs and agreed deliverables created specifically for your project, to the extent SLOBBERDOG can grant those rights;
- your accounts, subscriptions, assets and source materials, where the project runs through client-owned systems.

In practical terms: SLOBBERDOG does not get to take your show bible, unpublished footage, internal notes, audience data, production strategy or brand materials and use them for someone else.

---

## What belongs to SLOBBERDOG

The reusable technology layer belongs to SLOBBERDOG.

This includes:

- the agentic automation engine and orchestration layer;
- general-purpose agents, agent roles, reusable workflows and task-routing patterns;
- reusable prompt frameworks, evaluation methods, safety checks and quality-control processes;
- software libraries, API wrappers, dashboards, connectors, scripts and deployment methods;
- infrastructure patterns, monitoring approaches and managed-service systems;
- generic improvements created during the project that do not expose or depend on your confidential information;
- general know-how, methods and lessons learned from building and operating agentic systems.

In practical terms: if we expose a SLOBBERDOG API so your internal tool can call our automation engine, you are getting access to the engine. You are not buying the engine itself.

---

## What belongs to third-party providers

Where useful, SLOBBERDOG may connect your system to public or third-party tools.

Examples might include:

- large language model APIs;
- generative image tools;
- generative music tools;
- generative video tools;
- voice or transcription tools;
- cloud services;
- automation platforms;
- storage and monitoring systems.

Those services are not owned by you or by SLOBBERDOG. They are used under their own terms, pricing, availability, content rules and data policies.

A project can be designed to minimise dependency on a particular provider, but no third-party tool should be treated as if it is owned by the project unless the provider's terms actually say so.

---

## A TV/entertainment example

| Scenario | Ownership position |
|---|---|
| We build an internal assistant that turns episode notes into summaries, promo copy and asset requests. | Your notes, show context, approval rules, brand voice and generated project outputs are your layer. The reusable summarisation, routing and agent orchestration system is SLOBBERDOG’s layer. Any model API used underneath remains the provider’s layer. |
| We create a generative workflow that helps develop moodboards, temporary music directions or pitch references. | The project brief and approved outputs are your layer, subject to rights clearance and third-party terms. The generic workflow and prompt/evaluation framework remain SLOBBERDOG technology. Public tools remain subject to their own licences. |
| We expose a SLOBBERDOG API so your internal tool can call our automation engine. | The API access lets your product work. It does not mean the underlying engine has been sold. Owning the client app is different from owning the platform it calls. |
| We build a project-specific dashboard that shows your team's approvals, assets and outputs. | The data, content and company-specific configuration are your layer. The reusable dashboard components, backend services, agent engine and deployment patterns are SLOBBERDOG’s layer unless we agree otherwise. |

---

## What SLOBBERDOG can reuse

SLOBBERDOG can reuse general-purpose technology and know-how, including reusable agents, workflows, templates, engine improvements, API patterns, infrastructure patterns, testing approaches and lessons learned.

This is what lets us improve the platform over time and deliver future work faster.

For example, SLOBBERDOG may reuse:

- a generic summary workflow pattern;
- a generic approval-routing agent;
- a prompt-quality testing process;
- a metadata extraction pipeline;
- a dashboard component;
- an API wrapper;
- a safety or review checklist.

---

## What SLOBBERDOG cannot reuse

SLOBBERDOG cannot reuse or disclose your confidential layer.

That means we do not reuse:

- your confidential information;
- your unpublished scripts, show materials, internal notes or production documents;
- your commercial plans, audience data or strategy;
- your brand assets or client-owned media except for your project;
- your data or personal information except as required to provide the service;
- anything that would reveal your strategy, internal operations, creative direction, production pipeline or competitive position.

---

## What exclusivity means

By default, you are buying a project outcome and access to the technology needed to use it. You are not buying the right to stop SLOBBERDOG using its platform for anyone else.

If exclusivity is core to your strategy, that is a possibility, but it changes the economics.

Exclusivity might mean:

- sector exclusivity;
- competitor restrictions;
- a private engine;
- source-code ownership;
- self-hosting;
- white-labelling;
- a buy-out of platform rights.

Each needs to be scoped and priced deliberately.

---

## Generative AI: the practical caution

AI systems are useful, but they are not magic rights-clearance machines.

Before broadcast, publication, advertising, talent-facing use or external commercial release:

- AI outputs need human review;
- factual claims need checking;
- scripts, footage, music, voice, likeness, brand assets and performance materials need appropriate rights;
- public tools should not receive sensitive or rights-restricted material unless that use has been approved;
- a real person’s voice, likeness, identity or performance should not be generated or imitated without explicit rights and consent;
- some AI outputs may not be exclusive, protectable or safe for commercial exploitation without further clearance.

If a deliverable needs legal, copyright, music, broadcast, talent, guild, privacy, defamation, advertising or classification clearance, that should be scoped as a separate clearance process.

---

## The clean proposition

> The project-specific layer is yours.  
> The reusable technology layer is ours.  
> Third-party tools remain governed by their providers.  
> You get what you need to use the system we build.  
> We stay free to keep building SLOBBERDOG into a better agentic automation platform.  
> No exclusivity is implied unless we write it down and price it properly.

---

## Summary

SLOBBERDOG builds on and leverages our own reusable technical platform. 

The client-specific work stays with the client: your data, your confidential context, your project-specific workflow configuration, your outputs and your internal operating requirements.

The underlying engine stays with SLOBBERDOG: the reusable agents, workflow methods, orchestration logic, APIs, dashboards, testing systems and infrastructure patterns. You may interact with those tools through an app, API, automation, dashboard or managed service, but that access does not transfer ownership of the platform itself.

---

<p align="center"><strong>SLOBBERDOG.FYI</strong><br>You own your stuff. We own the engine. Nobody owns the third-party weirdness.</p>
