---
title: A History of Open Source Software
summary: Long before the phrase existed, programmers shared source code. The modern movement grew from that habit, a fight over user freedom, and a practical method for building software in public.
authors: [The Editors]
date: '2026-10-26'
tags: [software, open-source, history]
type: article
access: paid
---

Open source did not begin when someone uploaded a repository to the internet.
It did not begin with Linux, and it did not begin when the term *open source*
was coined in 1998.

Its history starts with a simpler fact: in early computing, software was often
something people exchanged in order to make expensive machines useful.

The movement that eventually acquired a name grew through several different
traditions. University researchers shared programs. User groups traded fixes.
Free-software activists argued that users deserved legal freedoms. Internet
communities learned to coordinate work at enormous scale. Companies discovered
that they could collaborate on common infrastructure while competing
elsewhere.

Those traditions overlap, but they are not identical. Understanding open
source requires keeping both the code and the ideas around it in view.

## Before software was a product

The first commercial computers were rare, costly, and incompatible with one
another. Software was usually written for a particular machine by its
manufacturer, customer, or research institution. Hardware was the product;
programs were a way to make the hardware perform useful work.

Sharing was practical. In 1955, users of IBM systems formed SHARE, an
organization that exchanged programs and documentation. Users of Digital
Equipment Corporation machines later formed DECUS and did much the same. The
[Computer History Museum’s account of early software](https://www.computerhistory.org/revolution/mainframe-computers/7/172)
describes a culture in which cooperation often mattered more than exclusion.

This was not “open source” in the present legal sense. There was no Open Source
Definition, and many programs lacked explicit licenses granting reuse and
modification rights. Access also belonged to a small community with expensive
machines. Still, the practice established a durable expectation: programmers
could improve their tools by reading and exchanging the source.

That expectation weakened as software became an industry of its own. In 1969,
IBM announced that it would separate, or unbundle, much of its software and
services from hardware pricing. Independent software businesses were already
emerging. Code increasingly became a product that could be licensed without
revealing how it worked.

The shift made commercial software markets possible. It also sharpened the
question that open source would later answer: what rights should travel with a
program?

## Unix, universities, and the network

Unix, developed at Bell Labs beginning in 1969, became central to the next
phase. AT&T licensed its source code to universities, where researchers could
study and modify it. At the University of California, Berkeley, those changes
grew into the Berkeley Software Distribution, or BSD.

BSD produced influential networking tools and helped spread the TCP/IP
software that powered the expanding internet. Its permissive licensing
tradition allowed broad reuse, including in proprietary systems. Modern
operating systems still carry descendants of that work.

The network changed collaboration itself. Source code, patches, and discussion
could travel through mailing lists and Usenet rather than on tapes. A project
no longer needed every contributor in the same institution. The internet was
not merely built with shared software; it became the medium through which
shared software could be built.

This period also exposed a tension. Research code might circulate among
colleagues while remaining subject to institutional or corporate restrictions.
The ability to obtain source was not the same as a durable legal right to use,
change, and redistribute it.

## Free software makes freedom explicit

Richard Stallman launched the GNU Project in 1983 to create a Unix-compatible
operating system whose users would be free to run, study, modify, and share
it. GNU began active development in 1984, and Stallman founded the Free
Software Foundation in 1985. The
[FSF’s history](https://www.fsf.org/history) records the progression from the
initial announcement to the GNU Manifesto and the organization that supported
the work.

Here, *free* referred to freedom, not necessarily zero price. A person could
sell free software. What mattered was that recipients received the essential
freedoms as well.

The GNU General Public License, first released in 1989, turned that philosophy
into a legal mechanism. Copyright normally gives an author the power to
restrict copying and modification. The GPL uses copyright to require that
recipients get permission to copy, inspect, change, and redistribute the
software. Modified versions distributed to others must preserve the same
freedoms.

Stallman called this strategy *copyleft*.

Copyleft is one branch of the larger licensing family. Permissive licenses such
as BSD, MIT, and Apache grant wide reuse rights without generally requiring a
larger derivative work to use the same license. Both permissive and copyleft
licenses can qualify as free and open source. They differ over what downstream
distributors must give back.

GNU developers created compilers, shells, libraries, editors, and many other
parts of an operating system. The project’s own kernel was not ready to fill
the final central role. A separate project supplied it.

## Linux demonstrates internet-scale development

In 1991, Linus Torvalds, then a student in Helsinki, announced a small Unix-like
kernel and invited others to experiment with it. Version 0.01 was released in
September. Its original terms allowed source redistribution but prohibited
charging a fee, a restriction that would not meet today’s Open Source
Definition.

Torvalds changed the kernel to the GNU GPL in 1992. The combination of Linux,
GNU tools, and other free components produced a complete operating system that
could be copied, studied, and improved. The naming remains politically
meaningful: the Free Software Foundation favors *GNU/Linux* to acknowledge the
GNU system, while common usage often calls the whole system *Linux*.

Linux also demonstrated a development pattern that seemed implausible to many
software organizations. Contributors who did not work for one company could
coordinate through the internet, submit patches, review one another’s work,
and release frequently. Authority still existed—maintainers decided what to
accept—but participation was geographically distributed.

The model did not mean that everyone edited everything. Successful projects
developed governance, subsystem ownership, review norms, release processes,
and reputations. Openness expanded who *could* participate; it did not remove
the need for coordination.

By the mid-1990s, Linux distributions such as Debian, Slackware, Red Hat, and
SUSE packaged the kernel with thousands of other components. The Apache HTTP
Server, scripting languages, databases, and GNU tools formed an increasingly
capable stack for running the web.

## “Open source” gives the method a new name

The phrase *open source* became a deliberate movement label in 1998.

Netscape had announced that it would release the source code of its browser.
At a strategy meeting on February 3, participants discussed how to present
collaborative software development to businesses that associated “free
software” with either zero price or political argument. Christine Peterson
suggested *open source*.

The label emphasized practical benefits: inspectability, peer review, rapid
improvement, lower dependence on one vendor, and the ability to adapt software
for new uses. It did not erase the earlier free-software movement. It reframed
much of the same body of software and licensing practice for a different
audience.

Later that month, Eric Raymond and Bruce Perens founded the Open Source
Initiative. One of its first tasks was to establish a definition precise enough
to evaluate licenses. Perens adapted the Debian Free Software Guidelines,
which the Debian project had ratified in 1997.

The resulting Open Source Definition requires more than access to source code.
Among other things, a qualifying license must permit free redistribution,
provide source, allow derived works, and avoid discrimination against people,
groups, or fields of endeavor. The
[OSI’s institutional history](https://opensource.org/about/history-of-the-open-source-initiative)
and [Debian’s original Social Contract](https://www.debian.org/social_contract.1.0.en.html)
document that lineage.

This distinction remains important. “Source available” software may let people
read code while forbidding commercial use, competition, or particular kinds of
deployment. Those terms can be useful, but they are not open source under the
OSI definition.

Free software and open source therefore describe heavily overlapping sets of
licenses while emphasizing different reasons. Free-software advocates center
the rights of users. Open-source advocates have often centered development
quality and practical adoption. The disagreement is philosophical, not merely
vocabulary.

## A development model becomes infrastructure

After 1998, commercial adoption accelerated. Companies sold support,
integration, hosting, hardware, and enterprise distributions around software
that customers could inspect and modify. Red Hat showed that giving access to
source did not prevent a company from selling reliability and expertise.
Large technology firms began contributing to shared components because none
needed to own every layer of the stack.

The web normalized the result. Linux, Apache, MySQL, and languages such as PHP,
Perl, and Python became a common foundation. Browsers incorporated open-source
engines and libraries. Android built on the Linux kernel. Cloud computing
assembled enormous services from open-source operating systems, databases,
orchestration tools, and programming languages.

The economics were not simply charitable. A company could collaborate on
infrastructure that did not differentiate its product, reduce duplicated work,
influence a standard, attract developers, and sell complementary services.
At the same time, volunteer communities continued to build software for
education, autonomy, public service, and pleasure.

Open source had become both a commons and a market.

## Git and the social coding era

As projects grew, their tools changed. Early communities exchanged complete
archives or patches by email. Centralized version-control systems later gave
teams a shared history. In 2005, after the Linux kernel community lost
free-of-charge access to the proprietary BitKeeper system, Torvalds began
building Git.

Git was designed for speed, distributed work, and thousands of parallel lines
of development. Every clone could hold a complete project history. Developers
could create branches and exchange changes without relying on a single working
copy. The official
[short history of Git](https://git-scm.com/book/en/v2/Getting-Started-A-Short-History-of-Git.html)
describes how the needs of Linux shaped the tool.

GitHub, officially launched in April 2008, put a social interface around Git.
Repositories gained visible forks, issue trackers, profiles, review
conversations, and eventually the pull-request workflow. The company’s terse
[launch announcement](https://github.blog/news-insights/we-launched/) mentioned
commit comments and network graphs—features that made the relationships around
code as visible as the code itself.

GitHub did not invent public collaboration, and open source does not depend on
one hosting company. Projects also use GitLab, Codeberg, self-hosted forges,
mailing lists, and other systems. But the pull request lowered the social cost
of proposing a change. It turned contribution into an interaction many
developers could recognize across projects.

That convenience also centralized attention. When a large share of the
ecosystem depends on a small number of forges, registries, and build services,
distributed source control can coexist with concentrated infrastructure.

## Success revealed a maintenance problem

Open source now sits beneath products whose users may never know its name. An
application can depend on thousands of packages, each with its own
dependencies. A tiny library maintained by one person may become part of
critical systems around the world.

That abundance produces risk. Vulnerabilities such as Heartbleed in OpenSSL
showed how widely deployed infrastructure could lack resources proportionate
to its importance. Package registries created opportunities for dependency
confusion, malicious updates, and compromised maintainer accounts. The 2024
attempt to insert a backdoor into XZ Utils demonstrated that a patient attacker
could target not only code, but also the trust and exhaustion inside a
maintenance community.

The lesson is not that closed software is automatically safer. Proprietary
systems also contain severe vulnerabilities that outsiders cannot inspect.
The lesson is that visibility is a capability, not a guarantee. Someone still
has to review the code, reproduce the build, respond to reports, manage keys,
and sustain the people doing the work.

Governments and companies now invest more heavily in dependency inventories,
software bills of materials, signed releases, reproducible builds, security
audits, and maintainer funds. These practices acknowledge that consuming open
source creates responsibilities as well as savings.

## What has remained constant

The history of open source is often told as a victory of one development method
over another. The reality is less tidy. Open and proprietary software have
grown together, borrow from one another, and frequently occupy the same
product. Open-source projects can be welcoming or hostile, democratic or
concentrated, well funded or abandoned. Publishing code does not by itself
create a healthy community.

What open source does create is a set of legal possibilities.

A user can inspect the program. A student can learn from it. A company can
adapt it without waiting for a vendor. A community can continue a project when
its original sponsor leaves. A bug fix can travel beyond the organization that
found it.

The tools have changed from paper listings and magnetic tapes to mailing lists,
distributed repositories, automated tests, and global package networks. The
central act has not. Someone receives a program, understands it, changes it,
and gives the change to someone else.

Open source turned that act from an informal favor into a durable way of
building the world’s software.
