---
layout: post
title:  "The absolute simplest way to use your Bluesky posts as a blog comment backend"
date:   2024-11-26
categories: bluesky blog webdev
author: Jonathan Moallem
author-link: http://jonjondev.com
social_links:
    - { platform: Bluesky, user_url: "https://bsky.app/profile/jonjondev.com", icon_class: "fab fa-bluesky" }
    - { platform: Mastodon, user_url: "https://aus.social/@jonjon", icon_class: "fab fa-mastodon" }
    - { platform: LinkedIn, user_url: "https://www.linkedin.com/in/jonjondev", icon_class: "fab fa-linkedin-in" }
image: /assets/img/bluesky-blog-comments/link_preview.png
description: A how-to on using Bluesky's public API to provide your blog site's commenting functionality for free.
at_post_uri: "at://did:plc:pnjutx4jmndm3y52p22wxkfi/app.bsky.feed.post/3lbthq6yolk2f"
---

When we put together this blog site, we had the goal of owning the site tech ([Jekyll](http://jekyllrb.com)), being in control of the infrastructure ([GitHub Pages](https://pages.github.com)), and avoiding doing anything more complicated than hosting the words and assets for the blog posts. The biggest feature we had to sacrifice in doing so was a comments section, requiring some kind of database and add moderation overhead (or alternatively we could have used a paid, 3rd party service like [Disqus](https://disqus.com)).

After seeing [Bluesky developer, Emily Liu's blog post](https://emilyliu.me/blog/open-network) yesterday in which the site comment sections are populated from the replies to various Bluesky posts, I had a certain brain worm itching at me to add a similar thing for this site.

![Caps Collective blog comments screenshot](/blog/assets/img/bluesky-blog-comments/blog_comments_screenshot.png)

There's a lot of good info already out there on how to do things like this if you're doing the whole modern webdev thing of layers on layers with libraries or pulling in remote content. You can go check out [Emily's followup post](https://emilyliu.me/blog/comments) for some snippets and an NPM package, or a similar post from the [Bluesky client, Graysky's blog](https://graysky.app/blog/2024-02-05-adding-blog-comments) with a bit more of technical overview in Typescript.

For the purpose of this site, I just wanted to contact the service directly and do the work in Javascript to avoid adding any dependencies. Taking a look at the [Bluesky API docs for getPostThread](https://docs.bsky.app/docs/api/app-bsky-feed-get-post-thread), you can see that it is part of the public AppView API, and does not require any authentication. The appropriate GET request can be made from your site as so:

{% highlight javascript %}
var atPostUri = "at://did:plc:pnjutx4jmndm3y52p22wxkfi/app.bsky.feed.post/3khqjq7knia24";
var requestLink = "https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=" + atPostUri
var xmlHttp = new XMLHttpRequest();
xmlHttp.onreadystatechange = function() { 
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        var responseJson = JSON.parse(xmlHttp.responseText);
        if (typeof(responseJson) == 'undefined') {
            return;
        }
        console.log(responseJson);
    }
}
xmlHttp.open("GET", url, true);
xmlHttp.send(null);
{% endhighlight %}

As the docs outline, the only required parameter is the `uri`, which should be the "AT URI" to the post (you can find it by requesting the embed code for the post). As pointed out in Graysky's blog post, the user's handle could be used for the first part, but their DID (decentralised ID) would be more stable to name changes. If you want to read the docs, [there are other params and endpoints you can play with too](https://docs.bsky.app/docs/category/http-reference).

From the callback, you should receive a JSON object with (roughly) the following structure, noting that I've cut down a bit of unnecessary info for brevity:

{% highlight json %}
"thread": {
    "$type": "app.bsky.feed.defs#threadViewPost",
    "post": {
        "uri": "at://did:plc:pnjutx4jmndm3y52p22wxkfi/app.bsky.feed.post/3khqjq7knia24",
        "author": {
            "did": "did:plc:pnjutx4jmndm3y52p22wxkfi",
            "handle": "jonjondev.com",
            "displayName": "Jonathan Moallem",
            "avatar": "https://cdn.bsky.app/img/avatar/plain/did:plc:pnjutx4jmndm3y52p22wxkfi/bafkreiae5amodtkudktmxdrk5dkyvulsloyzktnxfzs2iz6lau7up2sdmm@jpeg",
        },
        "record": {
            "text": "With mere hours left in the year, I managed to write up the blog post I'd been threatening to do for a while on how the @capscollective.com team is using GitHub Actions to build, test, and publish our open-source Godot 4 projects at no cost.\n\nTake a tour of our indie-grade build pipeline automation!"
        },
        "replyCount": 1,
        "repostCount": 1,
        "likeCount": 2,
        "quoteCount": 0
    },
    "replies": [
        {
            "$type": "app.bsky.feed.defs#threadViewPost",
            "post": {
                "uri": "at://did:plc:bpqwlwfcekinuh3bulrc3xab/app.bsky.feed.post/3khqzjz3prx2a",
                "author": {
                    "did": "did:plc:bpqwlwfcekinuh3bulrc3xab",
                    "handle": "scree.bsky.social",
                    "displayName": "Renee O'flynn",
                    "avatar": "https://cdn.bsky.app/img/avatar/plain/did:plc:bpqwlwfcekinuh3bulrc3xab/bafkreihiyzs3gjpzkavoyd2asvwdmeyrnl4j3uan75lfpco66ynsnti3da@jpeg",
                },
                "record": {
                    "text": "That seems impressive especially after unity deciding to screw over indies"
                },
                "replyCount": 1,
                "repostCount": 0,
                "likeCount": 1,
                "quoteCount": 0,
            },
            "replies": [...]
        },
        ...
    ]
}
{% endhighlight %}

You can then use this JSON object however you wish, traversing it and pulling out data to generate the appropriate HTML.

[You can see a fully functioning example in motion here](/blog/assets/img/bluesky-blog-comments/bluesky_blog_comments_example.html). I've tried my best to cut it down to just the bare basics of what's needed between the HTML and Javascript to display all thread replies and post data as it is done on this blog.

___Side note__: I've set this site up, as well as the example such that if the request fails for any reason, it will not display any of the social features. This way we can be defensive about endpoint changes or service shutdowns._

### What's missing?

In the list of things that the comments section of this site __does not support__, the main ones would be:
- Handling replies containing images, GIFs and links
- ~~Displaying posts with rich text (this is done on the [Bluesky API via facets](https://docs.bsky.app/docs/advanced-guides/post-richtext))~~ [see update 27/11/2024]
- Hiding users blocked by our team's accounts or on a shared block list
- Sifting posts replied to by the team's accounts to the top

I am rather pleased with the results of my tinkering and I'm hoping to keep this system going for the foreseeable future. So far I am very impressed with the progress of Bluesky as a platform; the social life on there has really taken off this month and the tech behind it seems to be solid. I think our team will aim to keep posting there in the future with (hopefully) more _actual game-related content_.

---

#### Adding Support for Facets (update 27/11/2024)

I managed to get post links/tags/mentions working without using the [ATProto library](https://www.npmjs.com/package/@atproto/api), but as mentioned above, it was not a trivial task. The [docs mention](https://docs.bsky.app/docs/advanced-guides/post-richtext) that the code points in the facets refer to UTF-8, and Javascript strings are UTF-16.

The facets are essentially lengths of code points (characters) in UTF-8 specified with a type and extra display data. This may be used for rich text without the need for BBCode, Markdown, or HTML formatting. For now, the Bluesky API provides facets for user handle mentions, hashtags, and URLs.

![Caps Collective blog comments facets screenshot](/blog/assets/img/bluesky-blog-comments/blog_comments_facets_screenshot.png)

Encoding and decoding Javascript strings to and from UTF-8 can be done as so, noting that :

{% highlight javascript %}
const textEncoder = new TextEncoder();
const utf8Decoder = new TextDecoder();
const utf8Text = new Uint8Array(record.text.length * 3);
textEncoder.encodeInto(record.text, utf8Text);
var result = utf8Decoder.decode(utf8Text)
{% endhighlight %}

_Note the buffer allocation of three times the size of the original string; this is [recommended by Mozilla docs](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encodeInto) to ensure that conversion is guaranteed._

The work at this point just becomes a matter of finding the start and end points for each facet and assigning them correctly to their various links depending on the type. This information can be found under the post record in an array of facets.

I have also updated [the example HTML](/blog/assets/img/bluesky-blog-comments/bluesky_blog_comments_example.html) to include the code for detecting and applying transformations for facets within the post reply texts.
