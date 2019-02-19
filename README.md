## WEBSITE PREPROCESSOR FOR [nathanielbartlett.com](http://nathanielbartlett.com)
### SHORT DESCRIPTION
A Node.js program that generates the HTML for my website by processing a group of source files and an HTML template.
### DETAILS
A database holding information about all facets of my artist work is stored in a series of JSON files. Larger blocks of text (biography, etc.) are stored in a series of plain text files (.txt). When the preprocessor is run, these source materials are rendered into the structure provided by a HTML template.

Adding events, adding albums, changing the website layout, etc., is now much more convenient. As a nice side benefit, the database will also be usable in a variety of future projects.
#### Ultrahyphenation
To maximize horizontal text space in large text blocks, a soft hyphen (`&shy;`) is inserted between every alpha character. There is a list in linksPlus.json of special units (dB, kHz, etc.) that are exempt from ultrahyphenation (as well as changes in capitalization schemes by CSS).
### RUN THE PROGRAM
<pre><code>node engine.js templateFile outputFile hyph</code></pre>
* **templateFile:** The HTML template
* **outputFile:** The finished HTML file (to be used as index.html)
* **hyph:** Optional. Include this to activate ultrahyphenation