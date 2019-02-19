'use strict';

//
// Run the program:
//
// > node engine.js templateFile outputFile hyph
//
// (use nodejs command on Linux)
//
// templateFile: The HTML template
// outputFile: The finished HTML file (to be used as index.html)
// hyph: Optional. Include this to activate ultra hyphenation

var fs = require('fs');

//
// Command line input
//
var inputFile = process.argv[2];
var outputFile = process.argv[3];
var ultraHyphen = process.argv[4] === 'hyph';

//
// Misc setup
//
var softHyphen = '&shy;';
var tab = '  '; // tab is two spaces
var tagStart = '<ultraHyphenate>';
var tagEnd = '</ultraHyphenate>';
var interpunct = '&#8226;';
var eventDateArrow = '&#129050;';

var hyphenTagStart;
var hyphenTagEnd;

//
// Files
//
var inputFileString;
var linksPlus;
var artIntObjArr;
var compObjArr;
var discObjArr;
var otherRepObjArr;
var worksMediaObjArr;
var mcWorksObjArr;
var fmrpWorksObjArr;
// var photoVideoObjArr;
var eventsObjArr;
var eventsShortObjArr;
var scoresOverview;

//
// Ultra Hyphenate
//
if (ultraHyphen) {

    hyphenTagStart = '<ultraHyphenate>';
    hyphenTagEnd = '</ultraHyphenate>';

} else {

    hyphenTagStart = '';
    hyphenTagEnd = '';

}

//
// Read JSON data source Files and HTML template
//
try {
    
    linksPlus = JSON.parse(fs.readFileSync('./json/linksPlus.json', 'utf8'));
    artIntObjArr = JSON.parse(fs.readFileSync('./json/articlesAndInterviews.json', 'utf8'));
    compObjArr = JSON.parse(fs.readFileSync('./json/compositions.json', 'utf8'));
    discObjArr = JSON.parse(fs.readFileSync('./json/discography.json', 'utf8'));
    otherRepObjArr = JSON.parse(fs.readFileSync('./json/otherRepertoire.json', 'utf8'));
    worksMediaObjArr = JSON.parse(fs.readFileSync('./json/worksInOtherMedia.json', 'utf8'));
    mcWorksObjArr = JSON.parse(fs.readFileSync('./json/mcWorks.json', 'utf8'));
    fmrpWorksObjArr = JSON.parse(fs.readFileSync('./json/fmrp.json', 'utf8'));
    // photoVideoObjArr = JSON.parse(fs.readFileSync('./json/fmrp.json', 'utf8'));
    eventsObjArr = JSON.parse(fs.readFileSync('./json/events.json', 'utf8'));
    eventsShortObjArr = JSON.parse(fs.readFileSync('./json/eventsShort.json', 'utf8'));

    inputFileString = fs.readFileSync(inputFile, 'utf8');

} catch (error) {

    console.log(`\n${error}\n`);
    process.exit(1);

}

function isLetter(c) {
    return c.toLowerCase() !== c.toUpperCase();
}

function processText(strIn) {

    var str = strIn;
    
    for (let i = 0; i < str.length; i += 1) {

        if (
            i > 0 &&
            isLetter(str[i - 1]) &&
            isLetter(str[i])
        ) {

            str = `${str.slice(0, i)}${softHyphen}${str.slice(i)}`;
            i += 5;
        }

    }

    return str;

}

function ultraHyphenate(input) {

    var tagStartIndex;
    var tagEndIndex;
    var subStringBeginning;
    var subStringTheRest;
    var subStringEnd;
    var sectionToProcess;
    var hyphenatedText;
    var inputMod;

    inputMod = input;

    while (inputMod.indexOf(tagStart) > -1) {

        tagStartIndex = inputMod.indexOf(tagStart);
        subStringBeginning = inputMod.substring(0, tagStartIndex);
        subStringTheRest = inputMod.substring(tagStartIndex + tagStart.length);

        tagEndIndex = subStringTheRest.indexOf(tagEnd);
        sectionToProcess = subStringTheRest.substring(0, tagEndIndex);
        subStringEnd = subStringTheRest.substring(tagEndIndex + tagEnd.length);

        hyphenatedText = processText(sectionToProcess);
        inputMod = subStringBeginning + hyphenatedText + subStringEnd;

    }

    return inputMod;

}

function uniqueArray(ar) {
    var j = {};
  
    ar.forEach(function (v) {
        j[v + '::' + typeof v] = v;
    });
  
    return Object.keys(j).map(function (v) {
        return j[v];
    });
}

function getSectionText(sectionTag) {

    var sectionString;

    try {

        sectionString = fs.readFileSync(`./txt/${sectionTag}.txt`, 'utf8');
    
    } catch (error) {
    
        console.log(`\nNo file for ${sectionTag} found.\n`);
        process.exit(1);
    
    }

    return sectionString;
}

function addHyperlinks(sectionText) {

    var searchText;
    var urlText;
    var regExp;
    var sectionTextMod;

    sectionTextMod = sectionText;

    // Loop through each possible hyperlink
    for (let i = 0; i < linksPlus.links.length; i += 1) {

        searchText = linksPlus.links[i].text;
        urlText = `${hyphenTagEnd}<a href="${linksPlus.links[i].url}" target="_blank">${hyphenTagStart}${searchText}${hyphenTagEnd}</a>${hyphenTagStart}`;
        
        regExp = new RegExp(searchText, 'g'); // not 'gi', match case, as when looking for "NeXT"
        sectionTextMod = sectionTextMod.replace(regExp, urlText);

    }

    return sectionTextMod;

}

function escapeUnits(sectionText) {

    var searchText;
    var unitText;
    var regExp;
    var sectionTextMod;

    sectionTextMod = sectionText;

    // Loop through each possible unit
    for (let i = 0; i < linksPlus.units.length; i += 1) {

        searchText = linksPlus.units[i];
        unitText = `${hyphenTagEnd}<span class="units">${hyphenTagStart}${searchText}${hyphenTagEnd}</span>${hyphenTagStart}`;

        regExp = new RegExp(searchText, 'g');
        sectionTextMod = sectionTextMod.replace(regExp, unitText);

    }

    return sectionTextMod;

}

function findSpIndentForSection(sectionTag, inFile) {

    // Note: Currently using spaces, not tabs. A 'tab' width being 2 spaces

    var regexString;
    var regexp;
    var fullSectionTag;
    var numberOfTabs;
    var tabs = '';

    fullSectionTag = `<${sectionTag}>`;

    regexString = `\n.+<${sectionTag}>`;

    regexp = new RegExp(regexString);

    numberOfTabs = inFile.match(regexp)[0].length - fullSectionTag.length - 1; // Minus the \n

    for (let i = 0; i < numberOfTabs; i += 1) {
        tabs += ' ';
    }
    
    return tabs;

}

function addParagraphEnds(secText, startClass, endClass, countDown, pNumber, tabs) {

    var sectionTextMod;
    var newLine;

    // First paragraph
    if (pNumber === 0) {
        newLine = '\n';
    } else {
        newLine = '\n';
    }

    // Last paragraph
    if (countDown === 0 && pNumber !== 0) {
        sectionTextMod = `\n${tabs}<p class="${endClass}">${hyphenTagStart}${secText}${hyphenTagEnd}</p>\n`;
    } else if (countDown === 0 && pNumber === 0) { // only
        sectionTextMod = `\n${tabs}<p class="${endClass}">${hyphenTagStart}${secText}${hyphenTagEnd}</p>\n`;
    } else {
        sectionTextMod = `${newLine}${tabs}<p class="${startClass}">${hyphenTagStart}${secText}${hyphenTagEnd}</p>\n`;
    }

    return sectionTextMod;

}

function replaceTagWithContent(sectionTag, inFileString, processedContent) {

    var regExp;
    var targetTagText;

    targetTagText = `<${sectionTag}>`;
    regExp = new RegExp(targetTagText);

    return inFileString.replace(regExp, processedContent);

}

function twoDigitZeroPad(number) {
    return ('00' + number).substr(-2, 2);
}

function formatDateForWeb(date) {

    var dateArr;
    var month;
    var day;
    var year;

    dateArr = date.split('/');

    month = ('00' + dateArr[0]).substr(-2, 2);
    day = ('00' + dateArr[1]).substr(-2, 2);
    year = ('00' + (dateArr[2]).slice(2)).substr(-2, 2);

    return `${month}-${day}-${year}`;

}

function getRecordingData(recordingCode) {

    var compBaseArr;
    var rData;
    var recordingFound;
    var otherRepBaseArr;
    var inspectingArray;
    var arr;

    compBaseArr = compObjArr.compositions;
    otherRepBaseArr = otherRepObjArr.otherRepertoire;

    // Look in these array, in order
    inspectingArray = [

        compBaseArr,
        otherRepBaseArr

    ];

    rData = {};
    recordingFound = false;
    arr = 0;

    while (recordingFound === false && arr < inspectingArray.length) {

        // Loop through main elements in array
        for (let i = 0; i < inspectingArray[arr].length; i += 1) {

            // Loop recordings array. SKIP IF NULL
            if (inspectingArray[arr][i].recordings) {

                for (let y = 0; y < inspectingArray[arr][i].recordings.length; y += 1) {

                    if (inspectingArray[arr][i].recordings[y].recordingCode === recordingCode) {
                        
                        recordingFound = true;

                        rData = {
                            
                            for: inspectingArray[arr][i].recordings[y].for,
                            duration: inspectingArray[arr][i].recordings[y].duration,
                            performers: inspectingArray[arr][i].recordings[y].performers,
                            composer: inspectingArray[arr][i].recordings[y].composer,
                            webAudioNumber: inspectingArray[arr][i].recordings[y].webAudioNumber,
                            versionName: inspectingArray[arr][i].recordings[y].versionName,
                            subParts: inspectingArray[arr][i].recordings[y].subParts,
                            date: inspectingArray[arr][i].date.join('–') // an array!

                        };

                    }

                }

            }

        }

        arr += 1;

    }

    return rData;

}

function getCompositionData(title) {

    var compBaseArr;
    var cData;
    var compositionFound;
    var otherRepBaseArr;
    var inspectingArray;
    var arr;

    compBaseArr = compObjArr.compositions;
    otherRepBaseArr = otherRepObjArr.otherRepertoire;

    // Look in these arrays, in order
    inspectingArray = [

        compBaseArr,
        otherRepBaseArr

    ];

    cData = {};
    compositionFound = false;
    arr = 0;

    while (compositionFound === false && arr < inspectingArray.length) {

        // Loop through main elements in array
        for (let i = 0; i < inspectingArray[arr].length; i += 1) {

            if (inspectingArray[arr][i].title === title) {
                    
                compositionFound = true;

                cData = {
              
                    title: title,
                    composer: inspectingArray[arr][i].composer,
                    subParts: inspectingArray[arr][i].subParts,
                    date: inspectingArray[arr][i].date.join('–'),
                    for: inspectingArray[arr][i].for,
                    composedFor: inspectingArray[arr][i].composedFor,
                    occasion: inspectingArray[arr][i].occasion

                };

            }

        }

        arr += 1;

    }

    return cData;

}

function getVideoData(title) {

    var otherMediaBaseArr;
    var inspectingArray;
    var cData;
    var compositionFound;
    var arr;

    otherMediaBaseArr = worksMediaObjArr.worksInOtherMedia;

    // Look in these array, in order
    inspectingArray = [

        otherMediaBaseArr

    ];

    cData = {};
    compositionFound = false;
    arr = 0;

    while (compositionFound === false && arr < inspectingArray.length) {

        // Loop through main elements in array
        for (let i = 0; i < inspectingArray[arr].length; i += 1) {

            if (inspectingArray[arr][i].title === title) {
                    
                compositionFound = true;

                cData = {
              
                    title: title,
                    creator: inspectingArray[arr][i].creator,
                    subParts: inspectingArray[arr][i].subParts,
                    date: inspectingArray[arr][i].date.join('–'),
                    for: inspectingArray[arr][i].for,
                    createdFor: inspectingArray[arr][i].createdFor,
                    occasion: inspectingArray[arr][i].occasion

                };

            }

        }

        arr += 1;

    }

    return cData;

}

function makePerformerDataString(allPerformerData, tabs) {

    var names;
    var hasMultiplePerformers;
    var onlyOnePerformer;

    var performerStart;
    var performerBodyText; // list of all performers, or just name if one soloist
    var performerListArr;
    var trackNumberString;

    performerBodyText = '';

    // Is this an all soloists album
    for (let y = 0; y < allPerformerData.length; y += 1) {
                
        hasMultiplePerformers = false;

        if (allPerformerData[y].length > 1) {

            hasMultiplePerformers = true;
            break;

        }
        
    }

    // If an all soloist album, is it all the same soloist?
    if (!hasMultiplePerformers) {

        onlyOnePerformer = false;
        names = [];

        for (let y = 0; y < allPerformerData.length; y += 1) {

            for (let x = 0; x < allPerformerData[y].length; x += 1) {
                names.push(allPerformerData[y][x].name);
            }
        }

        names = uniqueArray(names);

        if (names.length === 1) {
            onlyOnePerformer = true;
        }

    }
    
    // If only one performer, just print the single name (no instruments)
    if (onlyOnePerformer) {

        performerStart = `${tabs}${tab}${tab}<span class="paraWorkTitle">${hyphenTagStart}performer${hyphenTagEnd}</span>\n`;
        performerBodyText = `${tabs}${tab}${tab}${hyphenTagStart}${addHyperlinks(names[0])}${hyphenTagEnd}\n`;

    // if multiple performers on the album
    } else {

        performerStart = `${tabs}${tab}${tab}<span class="paraWorkTitle">${hyphenTagStart}performers${hyphenTagEnd}</span>\n`;

        // Loop and build performers list
        for (let y = 0; y < allPerformerData.length; y += 1) {
            
            // If only one work on the album, do not print a track number for teh performers
            if (allPerformerData.length > 1) {
                trackNumberString = `${tabs}${tab}${tab}<span class="discogNumbers">[${twoDigitZeroPad(y + 1)}]</span> `;
            } else {
                trackNumberString = `${tabs}${tab}${tab}`;
            }

            // If a soloist, no print instrument
            if (allPerformerData[y].length === 1) {

                performerBodyText += [

                    `${tabs}${tab}${tab}${trackNumberString}`,
                    `${hyphenTagStart}${addHyperlinks(allPerformerData[y][0].name)}${hyphenTagEnd}\n`

                ].join('');
                
            } else {

                performerListArr = [];

                // Loop through list of performers for a work
                for (let x = 0; x < allPerformerData[y].length; x += 1) {
                    performerListArr.push(`${addHyperlinks(allPerformerData[y][x].name)} (${allPerformerData[y][x].instrument})`);
                }

                performerBodyText += [

                    `${tabs}${tab}${tab}${trackNumberString}`,
                    `${hyphenTagStart}${performerListArr.join(', ')}${hyphenTagEnd}\n`

                ].join('');

            }

        }

    }

    return performerStart + performerBodyText;

}

function makeComposerDataString(allComposerData, tabs) {

    var uniqueComposersArray;
    var composerBodyText;
    var composerStart;
    var names;
    var minTrackComposerArr;

    composerBodyText = '';
    names = [];
    minTrackComposerArr = [];

    // Put all names in one array, then make unique
    for (let i = 0; i < allComposerData.length; i += 1) {
        names = names.concat(allComposerData[i].join(', '));
    }

    uniqueComposersArray = uniqueArray(names);

    if (uniqueComposersArray.length === 1) {

        composerBodyText = `${tabs}${tab}${tab}${hyphenTagStart}${addHyperlinks(uniqueComposersArray[0])}${hyphenTagEnd}\n`;
        composerStart = `${tabs}${tab}${tab}<span class="paraWorkTitle">${hyphenTagStart}composer${hyphenTagEnd}</span>\n`;

    } else {

        composerStart = `${tabs}${tab}${tab}<span class="paraWorkTitle">${hyphenTagStart}composers${hyphenTagEnd}</span>\n`;

        // Loop through unique names and push tracks
        for (let i = 0; i < uniqueComposersArray.length; i += 1) {

            let tracks = [];

            for (let x = 0; x < allComposerData.length; x += 1) {

                if (uniqueComposersArray[i] === allComposerData[x].join(', ')) {
                    tracks.push(twoDigitZeroPad(x + 1));
                }

            }

            minTrackComposerArr.push({
                name: uniqueComposersArray[i],
                tracks: tracks
            });

        }

        for (let i = 0; i < minTrackComposerArr.length; i += 1) {

            composerBodyText += [

                `${tabs}${tab}${tab}<span class="discogNumbers">[${minTrackComposerArr[i].tracks.join(' ')}]</span> `,
                `${hyphenTagStart}${addHyperlinks(minTrackComposerArr[i].name)}${hyphenTagEnd}\n`

            ].join('');
            
        }

    }

    return composerStart + composerBodyText;

}

function makeTextBox(inFileString, sectionTag, title, nest, newTag, repeated, boxType) {

    var tabs;
    var nst;
    var textBoxString;
    var outputFileString;
    var newTagMod;
    var divClass;
    var extraBreak;

    tabs = findSpIndentForSection(sectionTag, inFileString);

    if (nest === true) {
        nst = 'Nest';
    } else {
        nst = '';
    }

    if (boxType === 'eventBox') {
        divClass = 'textAreaEvents';
        extraBreak = `${tabs}${tab}${tab}${tab}${tab}${tab}${tab}<br>\n`;
    } else {
        divClass = 'textArea standardText';
        extraBreak = '';
    }

    if (!newTag) {
        newTagMod = sectionTag;
    } else {
        newTagMod = newTag;
    }

    textBoxString = [
        
        '<div class="infoBoxContainer">\n',
        `${tabs}${tab}<article lang="en">\n`,
        `${tabs}${tab}${tab}<table class="infoTable">\n`,
        `${tabs}${tab}${tab}${tab}<tr>\n`,
        `${tabs}${tab}${tab}${tab}${tab}<td class="textCell">\n`,
        `${tabs}${tab}${tab}${tab}${tab}${tab}<p class="infoBoxTitle${nst}">${title}</p>\n`,
        `${tabs}${tab}${tab}${tab}${tab}${tab}<div class="${divClass}">\n`,
        extraBreak,
        `${tabs}${tab}${tab}${tab}${tab}${tab}${tab}<${newTagMod}>\n`,
        `${tabs}${tab}${tab}${tab}${tab}${tab}</div>\n`,
        `${tabs}${tab}${tab}${tab}${tab}</td>\n`,
        `${tabs}${tab}${tab}${tab}${tab}<td class="toggleBarCell${nst}"><div class="chevronColumn"></div></td>\n`,
        `${tabs}${tab}${tab}${tab}</tr>\n`,
        `${tabs}${tab}${tab}</table>\n`,
        `${tabs}${tab}</article>\n`,
        `${tabs}</div>`

    ].join('');

    if (repeated) {
        outputFileString = textBoxString;
    } else {
        outputFileString = replaceTagWithContent(sectionTag, inFileString, textBoxString);
    }

    return outputFileString;

}

function getLoudspeakerFormatString(input, tabs) {

    var loudspeakerFormat;

    if (input) {
        loudspeakerFormat = `${tabs}${tab}${hyphenTagStart}${input}${hyphenTagEnd} ${interpunct}\n`;
    } else {
        loudspeakerFormat = '';
    }

    return loudspeakerFormat;

}

function getPerformersString(performersArray, tabs) {

    var performers = [];
    var performersOut;

    if (performersArray) {
               
        // Loop through performers and make a string
        for (let i = 0; i < performersArray.length; i += 1) {
            
            performers.push(
                `${tabs}${tab}${hyphenTagStart}${performersArray[i].instrument}: ${performersArray[i].name}${hyphenTagEnd}`
            );
            
        }

        performersOut = performers.join(',\n');

        // final interpunct and newline
        performersOut += ` ${interpunct}\n`;

    }

    return performersOut;

}

function makeContentSubstring(

    contentNumberString,
    title,
    eventData,
    contents,
    loudspeakerFormat,
    performers,
    extra,
    tabs,
    multiMediaAudio

) {

    var contentsMod;
    var composerMod;
    var performersMod;
    var forMod;

    // Add hyperlinks, escape units
    contentsMod = addHyperlinks(escapeUnits(contents));
    composerMod = addHyperlinks(eventData.composer.join(', '));
    forMod = addHyperlinks(escapeUnits(`for ${eventData.for}`));

    if (performers) {
        performersMod = addHyperlinks(performers);
    } else {
        performersMod = performers;
    }

    return [

        `${tabs}${tab}${contentNumberString}\n`,
        `${tabs}${tab}${hyphenTagStart}${multiMediaAudio}${hyphenTagEnd}\n`,
        `${tabs}${tab}<span class="article-date">${hyphenTagStart}${title}${extra}${hyphenTagEnd}</span>\n`,
        `${tabs}${tab}(${eventData.date}) ${interpunct}\n`,
        `${tabs}${tab}${hyphenTagStart}${forMod}${hyphenTagEnd} ${interpunct}\n`,
        loudspeakerFormat,
        performersMod,
        `${tabs}${tab}${hyphenTagStart}${contentsMod}${hyphenTagEnd} ${interpunct}\n`,
        `${tabs}${tab}${hyphenTagStart}Composer: ${composerMod}${hyphenTagEnd}\n`

    ].join('');

}

function makeVideoContentSubstring(

    eventData,
    contents,
    performers,
    extra,
    tabs

) {

    var contentsMod;
    var creatorMod;
    var performersMod;
    var forMod;

    // Add hyperlinks, escape units
    contentsMod = addHyperlinks(escapeUnits(contents));
    creatorMod = addHyperlinks(eventData.creator.join(', '));
    forMod = addHyperlinks(escapeUnits(`for ${eventData.for}`));

    if (performers) {
        performersMod = addHyperlinks(performers);
    } else {
        performersMod = performers;
    }
    

    return [
        
        `${tabs}${tab} ${interpunct} Video: <span class="article-date">${hyphenTagStart}${eventData.title}${extra}${hyphenTagEnd}</span>\n`,
        `${tabs}${tab}(${eventData.date}) ${interpunct}\n`,
        `${tabs}${tab}${hyphenTagStart}${forMod}${hyphenTagEnd} ${interpunct}\n`,
        performersMod,
        `${tabs}${tab}${hyphenTagStart}${contentsMod}${hyphenTagEnd} ${interpunct}\n`,
        `${tabs}${tab}${hyphenTagStart}Video Artist: ${creatorMod}${hyphenTagEnd}\n`

    ].join('');

}

function isExtra(extraString) {

    var extraOutput;

    if (extraString) {
        extraOutput = ` (${extraString})`;
    } else {
        extraOutput = '';
    }

    return extraOutput;

}

function getMusicContentSubstring(contentNumberString, currentEventContents, tabs, av) {

    var contentSubString;
    var eventData;
    var performers;
    var extra;
    var loudspeakerFormat;
    var multiMediaAudio;
    var workTitle;

    if (currentEventContents.type === 'Fixed Media') {

        eventData = getRecordingData(currentEventContents.recording);
        performers = getPerformersString(eventData.performers, tabs);

    } else if (currentEventContents.type === 'Live') {

        eventData = getCompositionData(currentEventContents.title);
        performers = getPerformersString(currentEventContents.performers, tabs);

    }

    // Overwrite data with proper sub part info
    if (currentEventContents.subPart) {

        for (let x = 0; x < eventData.subParts.length; x += 1) {
            
            if (currentEventContents.subPart === eventData.subParts[x].number) {

                eventData.versionName += `, ${eventData.subParts[x].title}`;

                if (currentEventContents.type === 'Fixed Media') {
                    eventData.performers = eventData.subParts[x].performers;
                }

                eventData.composer = eventData.subParts[x].composer;
                eventData.for = eventData.subParts[x].for;

                break;

            }

        }

    }

    loudspeakerFormat = getLoudspeakerFormatString(currentEventContents.format, tabs);

    // Extra text after title
    extra = isExtra(currentEventContents.extra);

    if (av) {
        multiMediaAudio = `Multi Media Work ${interpunct} Audio: `;
    } else {
        multiMediaAudio = '';
    }

    if (eventData.title) {
        workTitle = eventData.title;
    } else {
        workTitle = eventData.versionName;
    }

    // Separate composer, for, and date
    contentSubString = makeContentSubstring(

        contentNumberString,
        // eventData.versionName,
        workTitle,
        eventData,
        currentEventContents.type,
        loudspeakerFormat,
        performers,
        extra,
        tabs,
        multiMediaAudio
    
    );

    return contentSubString;

}

function getVideoContentSubstring(currentEventContents, tabs) {

    var contentSubString;
    var eventData;
    var performers;
    var extra;
    
    eventData = getVideoData(currentEventContents.title);

    // Overwrite data with proper sub part info
    if (currentEventContents.subPart) {

        for (let x = 0; x < eventData.subParts.length; x += 1) {
            
            if (currentEventContents.subPart === eventData.subParts[x].number) {

                eventData.versionName += `, ${eventData.subParts[x].title}`;
                eventData.performers = eventData.subParts[x].performers;
                eventData.creator = eventData.subParts[x].creator;
                eventData.for = eventData.subParts[x].for;

                break;

            }

        }

    }

    if (eventData.performers) {
        performers = getPerformersString(eventData.performers, tabs);
    } else {
        performers = '';
    }

    // Extra text after title
    extra = isExtra(currentEventContents.extra);

    // Separate composer, for, and date
    contentSubString = makeVideoContentSubstring(
        
        eventData,
        currentEventContents.type,
        performers,
        extra,
        tabs
    
    );

    return contentSubString;

}

function makeEventString(currentEvent, sectionTag, eventString) {
    
    var tabs;
    var mainDetailsString;
    var contentNumber;
    var contentNumberString;
    var contentSubString;
    var contentString;
    var value;
    var archiveString;
    var buttonText;

    mainDetailsString = '';
    contentString = '';
    archiveString = '';
    
    tabs = findSpIndentForSection(sectionTag, eventString);

    for (let i = 0; i < currentEvent.mainDetails.length; i += 1) {

        if (typeof currentEvent.mainDetails[i].value === 'object') {
            value = currentEvent.mainDetails[i].value.join(' to ');
        } else {
            value = currentEvent.mainDetails[i].value;
        }

        value = addHyperlinks(value);

        mainDetailsString += [

            `${tabs}${tab}<span class="article-date">${hyphenTagStart}`,
            `${currentEvent.mainDetails[i].name}${hyphenTagEnd}</span> `,
            `${hyphenTagStart}${value}${hyphenTagEnd}\n`

        ].join('');

    }

    mainDetailsString = [
        
        '<p class="disc-para">\n',
        mainDetailsString,
        `${tabs}</p>\n`

    ].join('');

    // Add dots
    mainDetailsString += `${tabs}<div class="scoreDots centerIt">${interpunct}${interpunct}${interpunct}${interpunct}${interpunct}</div>\n`;

    // Contents
    for (let i = 0; i < currentEvent.contents.length; i += 1) {
        
        contentNumber = twoDigitZeroPad(i + 1);
        contentNumberString = `<span class="circleNumber2"><span class="circleNumber">${contentNumber}</span></span>`;

        if (
            currentEvent.contents[i].type === 'Fixed Media'
            || currentEvent.contents[i].type === 'Live'
        ) {

            contentSubString = getMusicContentSubstring(contentNumberString, currentEvent.contents[i], tabs, false);
        
        } else if (currentEvent.contents[i].type === 'AV') {

            // Get the Audio first. The true means put 'Audio: ' in front
            contentSubString = getMusicContentSubstring(contentNumberString, currentEvent.contents[i].audio, tabs, true);
            contentSubString += getVideoContentSubstring(currentEvent.contents[i].video, tabs);
        
        } else {

            // Make the simple event type + text string
            contentSubString = [

                `${tabs}${tab}${contentNumberString}\n`,
                `${tabs}${tab}<span class="article-date">${currentEvent.contents[i].type}</span> ${currentEvent.contents[i].text}\n`
    
            ].join('');

        }

        contentString += contentSubString;

    }

    // Put contents in paragraph
    contentString = [
        
        `${tabs}<p class="disc-para-last">\n`,
        contentString,
        `${tabs}</p>`

    ].join('');

    // Process the archive links
    if (currentEvent.archive) {

        for (let i = 0; i < currentEvent.archive.length; i += 1) {

            buttonText = currentEvent.archive[i].type.split(' ').join('&nbsp;');

            if (currentEvent.archive[i].link.indexOf('onclick') > -1) {
                archiveString += `<a ${currentEvent.archive[i].link}>${buttonText}</a>`;
            } else {
                archiveString += `<a href="${currentEvent.archive[i].link}" target="_blank">${buttonText}</a>`;
            }

        }

        archiveString = [

            '\n',
            `${tabs}<div class="eventButtonAreaLeft">\n`,
            `${tabs}${tab}<div class="buttonGroupLeft">\n`,
            `${tabs}${tab}${tab}${archiveString}\n`,
            `${tabs}${tab}</div>\n`,
            `${tabs}</div>`
    
        ].join('');

    }

    return [

        mainDetailsString,
        contentString,
        archiveString

    ].join('');

}

function processAllTextSection(inFileString, sectionTag, nest) {

    var sectionTextString;
    var sectionTextArr;
    var firstParagraphClass;
    var lastParagraphClass;
    var paraNumberCountdown;
    var sectionTextProcessed;
    var outputFileString;
    var tabs;
    var inFileStringMod;
    var sectionTitle;
    var nestedInfoBoxTags;
    var nestedInfoBoxTagsArr;
    var end;

    inFileStringMod = inFileString;

    firstParagraphClass = 'infoBoxPara';
    lastParagraphClass = 'infoBoxParaLast';

    // Read in the txt file
    sectionTextString = getSectionText(sectionTag);
    sectionTextArr = sectionTextString.split('\n\n');
    sectionTitle = sectionTextArr[0];
    sectionTextArr.shift();

    // Remove nested info boxes
    for (let i = 0; i < sectionTextArr.length; i += 1) {

        if (sectionTextArr[i][0] === '<') {

            nestedInfoBoxTags = sectionTextArr[i];
            sectionTextArr.splice(i, 1);

        }

    }
    
    // Add text box container (with tag)
    inFileStringMod = makeTextBox(inFileStringMod, sectionTag, sectionTitle, nest);

    tabs = findSpIndentForSection(sectionTag, inFileStringMod);

    // Loop through all text sections
    for (let i = 0; i < sectionTextArr.length; i += 1) {

        // So I can tell when it is the last para (or only). 0 = last (or only).
        paraNumberCountdown = (sectionTextArr.length - 1) - i;

        sectionTextArr[i] = addHyperlinks(sectionTextArr[i]);
        sectionTextArr[i] = addParagraphEnds(sectionTextArr[i], firstParagraphClass, lastParagraphClass, paraNumberCountdown, i, tabs);
        sectionTextArr[i] = escapeUnits(sectionTextArr[i]);

    }

    if (nestedInfoBoxTags) {
    
        nestedInfoBoxTagsArr = nestedInfoBoxTags.split('\n');

        for (let i = 0; i < nestedInfoBoxTagsArr.length; i += 1) {

            if (i < nestedInfoBoxTagsArr.length - 1) {
                end = '\n';
            } else {
                end = '';
            }

            sectionTextArr.push(`${tabs}${nestedInfoBoxTagsArr[i]}${end}`);

        }

    }
    
    sectionTextProcessed = sectionTextArr.join('');
    outputFileString = replaceTagWithContent(sectionTag, inFileStringMod, sectionTextProcessed);

    return outputFileString;

}
function sortAlphabetically(arr) {

    var modArr = arr;
    var titleA;
    var titleB;

    modArr.sort(function (a, b) {

        titleA = a.title.toUpperCase();
        titleB = b.title.toUpperCase();

        if (titleA < titleB) return -1;
        if (titleA > titleB) return 1;
        return 0;

    });

    return modArr;

}

function sortChronologically(arr) {

    var modArr = arr;

    modArr.sort(function (a, b) {

        var aDate;
        var bDate;
                
        if (typeof a.date === 'string' && a.date.indexOf('/') > -1) {

            aDate = new Date(a.date);
            bDate = new Date(b.date);

        } else if (typeof a.date === 'number') {
            
            aDate = a.date;
            bDate = b.date;

        // For events, where .date holds array of start date and possible end date
        } else if (typeof a.date === 'object') {
            
            aDate = new Date(a.date[0]);
            bDate = new Date(b.date[0]);

        } else {

            aDate = a;
            bDate = b;

        }

        return bDate - aDate;

    });

    return modArr;

}

function subPartsSameFor(subParts) {

    var allForArr;
    var uniqueArr;

    allForArr = [];

    for (let i = 0; i < subParts.length; i += 1) {
        allForArr.push(subParts[i].for);
    }

    uniqueArr = uniqueArray(allForArr);

    return uniqueArr.length === 1;

}

function processArticlesAndInterviews(inFileString, sectionTag, nest) {

    var allInOneArray;
    var oneItemString;
    var tabs;
    var inFileStringMod;
    var sectionTitle;

    var actionLinkString;
    var audioLinkA;
    var audioLinkB;
    var audioLinkC;
    var pdfLinkA;
    var pdfLinkB;
    var pdfLinkC;

    var sectionTextArr;
    var sectionTextProcessed;
    var outputFileString;
    var publicationWithLink;
    var formatedDate;

    sectionTextArr = [];
    inFileStringMod = inFileString;

    sectionTitle = 'Articles and Interviews';
    inFileStringMod = makeTextBox(inFileStringMod, sectionTag, sectionTitle, nest);

    tabs = findSpIndentForSection(sectionTag, inFileStringMod);

    audioLinkA = '<span class="playButton" onclick="launchAudio(';
    audioLinkB = ')">';
    audioLinkC = '</span>';

    pdfLinkA = '<a href="';
    pdfLinkB = '" target="_blank">';
    pdfLinkC = '</a>';

    allInOneArray = artIntObjArr.articles.concat(artIntObjArr.interviews);

    // Sort chronologically
    allInOneArray = sortChronologically(allInOneArray);

    for (let i = 0; i < allInOneArray.length; i += 1) {

        if (allInOneArray[i].mediaLink.type === 'audio') {

            actionLinkString = [

                audioLinkA,
                allInOneArray[i].mediaLink.link,
                audioLinkB,
                allInOneArray[i].mediaLink.type,
                audioLinkC

            ].join('');

        } else if (allInOneArray[i].mediaLink.type === 'pdf') {

            actionLinkString = [

                pdfLinkA,
                allInOneArray[i].mediaLink.link,
                pdfLinkB,
                allInOneArray[i].mediaLink.type,
                pdfLinkC

            ].join('');

        }

        publicationWithLink = addHyperlinks(allInOneArray[i].publication);

        formatedDate = formatDateForWeb(allInOneArray[i].date);

        oneItemString = [

            `\n${tabs}${tab}<span class="article-date">${formatedDate}</span>`,
            ' ',
            `${hyphenTagStart}${publicationWithLink}${hyphenTagEnd}`,
            ' ',
            `${actionLinkString}\n`

        ].join('');

        sectionTextArr.push(oneItemString);

    }

    // Add paragraph container
    sectionTextArr.unshift('<p class="interviewPara">\n');
    sectionTextArr.push(`${tabs}</p>`);

    sectionTextProcessed = sectionTextArr.join('');
    outputFileString = replaceTagWithContent(sectionTag, inFileStringMod, sectionTextProcessed);

    return outputFileString;

}

function processDiscography(inFileString, sectionTag) {

    var discographyBaseArr;
    var albumTitle;
    var discHeader;
    var tabs;
    var worksLines;
    var work;
    var rData;
    var albumDate;
    var albumMedia;
    var albumLabel;
    var albumCode;
    var albumFormats;
    var allPerformerData;
    var allComposerData;
    var performerBodyText; // list of all performers, or just name if one soloist
    var composerBodyText;
    var data;
    var dots;
    var wholeItem;
    var discographyHtmlArr;
    var sectionTextProcessed;
    var outputFileString;
    var subNumbers;
    var subEndNumber;
    var subPlayButtons;
    var subDurations;
    var subTitle;
    var subFor;
    var why;
    var subPartNumbers;
    
    discographyHtmlArr = [];

    // Get all active discography items
    discographyBaseArr = discObjArr.discography;

    // Sort chronologically
    discographyBaseArr = sortChronologically(discographyBaseArr);

    tabs = findSpIndentForSection(sectionTag, inFileString);

    // Loop through and make each item
    for (let i = 0; i < discographyBaseArr.length; i += 1) {

        // Album title
        albumTitle = discographyBaseArr[i].title;
        albumDate = discographyBaseArr[i].date;
        albumMedia = discographyBaseArr[i].media.join(', ');
        albumLabel = discographyBaseArr[i].labelAndCode.split(',')[0];
        albumCode = discographyBaseArr[i].labelAndCode.split(',')[1];
        albumFormats = discographyBaseArr[i].audioFormats.join(', ');

        worksLines = [];
        allPerformerData = [];
        allComposerData = [];
        performerBodyText = '';

        // why? to deal with track number increment when subParts are present
        // and 1 index works.
        why = 1;

        if (discographyBaseArr[i].contentType === 'audio' && discographyBaseArr[i].active === true) {

            // Loop through the works on the album
            for (let y = 0; y < discographyBaseArr[i].works.length; y += 1) {

                subPlayButtons = '';
                subDurations = '';
                subTitle = '';
                subFor = '';
                subPartNumbers = ':';

                rData = getRecordingData(discographyBaseArr[i].works[y]);

                if (rData.subParts) {

                    subEndNumber = why + rData.subParts.length;

                    subNumbers = [

                        `${tabs}${tab}${tab}<span class="circleNumber2"><span class="circleNumber">${twoDigitZeroPad(why)}</span></span><!--\n`,
                        `${tabs}${tab}${tab}--><span class="fa fa-arrow-right" aria-hidden="true"></span><!--\n`,
                        `${tabs}${tab}${tab}--><span class="circleNumber2"><span class="circleNumber">`,
                        `${twoDigitZeroPad(subEndNumber)}</span></span>\n`

                    ].join('');

                    for (let x = 0; x < rData.subParts.length; x += 1) {

                        subPlayButtons += [

                            `${tabs}${tab}${tab}<span class="playButton" onclick="launchAudio(`,
                            `${rData.subParts[x].webAudioNumber})">play</span>\n`

                        ].join('');

                        subPartNumbers += ` ${twoDigitZeroPad(rData.subParts[x].number)}`;

                        allPerformerData.push(rData.subParts[x].performers);
                        allComposerData.push(rData.subParts[x].composer);

                    }

                    subTitle += [

                        `${tabs}${tab}${tab}<span class="paraWorkTitle">${hyphenTagStart}`,
                        `${rData.versionName}${subPartNumbers}${hyphenTagEnd}</span>\n`

                    ].join('');

                    // Figure out if different instrumentation is used for each of the sub parts
                    if (subPartsSameFor(rData.subParts)) {

                        subFor = `${tabs}${tab}${tab}${hyphenTagStart}${rData.for}${hyphenTagEnd}\n`;

                        for (let x = 0; x < rData.subParts.length; x += 1) {

                            subDurations += [

                                `${tabs}${tab}${tab}<span class="discogNumbers">[${twoDigitZeroPad(rData.subParts[x].number)}]</span>`,
                                `${tabs}${tab}${tab}<span class="discDuration">${rData.subParts[x].duration}</span>\n`

                            ].join('');

                        }
                      
                    } else {

                        for (let x = 0; x < rData.subParts.length; x += 1) {

                            subFor += [

                                `${tabs}${tab}${tab}<span class="discogNumbers">[${twoDigitZeroPad(rData.subParts[x].number)}]</span> `,
                                `${hyphenTagStart}${rData.subParts[x].for}${hyphenTagEnd}\n`,
                                `${tabs}${tab}${tab}<span class="discDuration">${rData.subParts[x].duration}</span>\n`

                            ].join('');

                            subDurations = '';

                        }

                    }

                    work = [

                        subNumbers,
                        subTitle,
                        subPlayButtons,
                        // subTitle,
                        subFor,
                        subDurations

                    ];

                    why += rData.subParts.length;
                    
                } else {

                    work = [

                        `${tabs}${tab}${tab}<span class="circleNumber2"><span class="circleNumber">${twoDigitZeroPad(why)}</span></span>\n`,
                        `${tabs}${tab}${tab}<span class="paraWorkTitle">${hyphenTagStart}${rData.versionName}${hyphenTagEnd}</span>\n`,
                        `${tabs}${tab}${tab}<span class="playButton" onclick="launchAudio(${rData.webAudioNumber})">play</span>\n`,
                        // `${tabs}${tab}${tab}<span class="paraWorkTitle">${hyphenTagStart}${rData.versionName}${hyphenTagEnd}</span>\n`,
                        `${tabs}${tab}${tab}${hyphenTagStart}${rData.for}${hyphenTagEnd}\n`,
                        `${tabs}${tab}${tab}<span class="discDuration">${rData.duration}</span>\n`
    
                    ];

                    allPerformerData.push(rData.performers);
                    allComposerData.push(rData.composer);

                }

                // Put in master array
                worksLines = worksLines.concat(work);
                why += 1;

            }

            worksLines = [

                `${tabs}${tab}<p class="disc-para">\n`,
                worksLines.join(''),
                `${tabs}${tab}</p>\n`

            ].join('');

            performerBodyText = makePerformerDataString(allPerformerData, tabs);
            composerBodyText = makeComposerDataString(allComposerData, tabs);

            // Add end data
            data = [

                `${tabs}${tab}${tab}<span class="paraWorkTitle">${hyphenTagStart}Date${hyphenTagEnd}`,
                `</span> ${albumDate}\n`,
                `${tabs}${tab}${tab}<span class="paraWorkTitle">${hyphenTagStart}Label${hyphenTagEnd}`,
                `</span> ${hyphenTagStart}${addHyperlinks(albumLabel)}${hyphenTagEnd}\n`,
                `${tabs}${tab}${tab}<span class="paraWorkTitle">${hyphenTagStart}Code${hyphenTagEnd}`,
                `</span> ${hyphenTagStart}${addHyperlinks(albumCode)}${hyphenTagEnd}\n`,
                `${tabs}${tab}${tab}<span class="paraWorkTitle">${hyphenTagStart}Media${hyphenTagEnd}`,
                `</span> ${albumMedia}\n`,
                `${tabs}${tab}${tab}<span class="paraWorkTitle">${hyphenTagStart}Audio Formats${hyphenTagEnd}`,
                `</span> ${albumFormats}\n`

            ].join('');

            dots = `${tabs}${tab}<div class="scoreDots centerIt">${interpunct}${interpunct}${interpunct}${interpunct}${interpunct}</div>\n`;
            discHeader = `${tabs}${tab}<h3 class="disc-header">${albumTitle}</h3>\n`;

            wholeItem = [

                `\n${tabs}<div class="discography-item">\n`,
                discHeader,
                worksLines,
                dots,
                `${tabs}${tab}<p class="disc-para-last">\n`,
                performerBodyText,
                composerBodyText,
                data,
                `${tabs}${tab}</p>\n`,
                `${tabs}</div>\n`

            ].join('');

            discographyHtmlArr.push(wholeItem);

        }

    }

    sectionTextProcessed = discographyHtmlArr.join('');

    outputFileString = replaceTagWithContent(sectionTag, inFileString, sectionTextProcessed);

    return outputFileString;

}

function processMarCompWorks(inFileString, sectionTag, nest) {

    var sectionTitle;
    var inFileStringMod;
    var tabs;
    var worksBaseArr;
    var worksText;
    var outputFileString;

    inFileStringMod = inFileString;
    worksText = ['<p class="interviewPara">\n'];
    worksBaseArr = mcWorksObjArr.mcWorks;

    // Sort
    worksBaseArr = sortChronologically(worksBaseArr);

    sectionTitle = 'Works';
    inFileStringMod = makeTextBox(inFileStringMod, sectionTag, sectionTitle, nest);

    tabs = findSpIndentForSection(sectionTag, inFileStringMod);

    for (let i = 0; i < worksBaseArr.length; i += 1) {

        if ((i === 0) || (worksBaseArr[i - 1].date !== worksBaseArr[i].date)) {

            worksText.push(`${tabs}${tab}<span class="article-date">${worksBaseArr[i].date}</span>\n`);
            worksText.push(`${tabs}${tab}${hyphenTagStart}${worksBaseArr[i].name}${hyphenTagEnd}\n`);

        } else {
            
            worksText.push(`${tabs}${tab}${interpunct} ${hyphenTagStart}${worksBaseArr[i].name}${hyphenTagEnd}\n`);

        }

    }

    worksText.push(`${tabs}</p>`);
    worksText = worksText.join('');

    outputFileString = replaceTagWithContent(sectionTag, inFileStringMod, worksText);

    return outputFileString;

}

function processFmrpWorksBox(inFileString, sectionTag, nest) {

    var worksArr;
    var inFileStringMod;
    var sectionTitle;
    var tabs;
    var oneItemString;
    var sectionTextArr = [];
    var sectionTextProcessed;
    var outputFileString;

    inFileStringMod = inFileString;

    sectionTitle = sectionTextArr[0];
    sectionTextArr.shift();

    sectionTitle = 'Works';
    inFileStringMod = makeTextBox(inFileStringMod, sectionTag, sectionTitle, nest);

    tabs = findSpIndentForSection(sectionTag, inFileStringMod);

    worksArr = fmrpWorksObjArr.fmrp;

    for (let i = 0; i < worksArr.length; i += 1) {

        oneItemString = [

            `\n${tabs}${tab}<span class="article-date">${hyphenTagStart}${worksArr[i].name}${hyphenTagEnd}</span>`,
            ' ',
            `${hyphenTagStart}${addHyperlinks(worksArr[i].composer)}${hyphenTagEnd}`,
            ' ',
            `${worksArr[i].date.join('–')} ${worksArr[i].channelsFormat}\n`

        ].join('');

        sectionTextArr.push(oneItemString);

    }

    // Add paragraph container
    sectionTextArr.unshift('<p class="interviewPara">\n');
    sectionTextArr.push(`\n${tabs}</p>`);

    sectionTextProcessed = sectionTextArr.join('');
    outputFileString = replaceTagWithContent(sectionTag, inFileStringMod, sectionTextProcessed);

    return outputFileString;

}

function processEventsCompleteSection(inFileString, sectionTag) {

    var inFileStringMod;
    var allEvents;
    var allYears;
    var newTag;
    var yearBoxes;
    var eventBoxes;
    var eventsSortedObj;
    var objKeys;
    var eventBoxType;
    var eventYear;
    var sectionTagSub;
    var currentEvent;
    var dateArray;
    var eventBoxTitle;
    var eventString;
    var extraLocationText;
    var tabs;
    var extraPad;

    allYears = [];
    yearBoxes = '';
    eventsSortedObj = {};
    dateArray = [];
    eventBoxType = 'eventBox';

    tabs = findSpIndentForSection(sectionTag, inFileString);

    inFileStringMod = inFileString;

    // Get all the events
    allEvents = eventsObjArr.events;

    // Find all years for events
    for (let i = 0; i < allEvents.length; i += 1) {
        allYears.push(+allEvents[i].date[0].split('/')[2]);
    }

    // Dedupe and sort allYears
    allYears = uniqueArray(allYears);
    allYears = sortChronologically(allYears);

    // Make a box for each year, in order
    for (let i = 0; i < allYears.length; i += 1) {

        if (allYears.length - i !== 1) {
            extraPad = `\n${tabs}`;
        } else {
            extraPad = '';
        }

        newTag = 'year' + allYears[i].toString();
        yearBoxes += makeTextBox(inFileStringMod, sectionTag, allYears[i].toString(), false, newTag, true);
        yearBoxes += extraPad;

    }

    inFileStringMod = replaceTagWithContent(sectionTag, inFileStringMod, yearBoxes);

    // Make event boxes:
    // Start by putting all events into an arrays, make members of object, named by year
    // Make object
    for (let i = 0; i < allYears.length; i += 1) {
        eventsSortedObj[allYears[i]] = [];
    }

    // Push events into correct arrays
    for (let i = 0; i < allEvents.length; i += 1) {

        // Find year as string
        eventYear = allEvents[i].date[0].split('/')[2];
        eventsSortedObj[eventYear].push(allEvents[i]);
    }

    // Get object keys
    objKeys = Object.keys(eventsSortedObj);

    // Sort event sub arrays
    for (let i = 0; i < objKeys.length; i += 1) {

        eventsSortedObj[objKeys[i]] = sortChronologically(eventsSortedObj[objKeys[i]]);
        sectionTagSub = `year${objKeys[i]}`;
        eventBoxes = '';

        tabs = findSpIndentForSection(sectionTagSub, inFileStringMod);

        for (let x = 0; x < eventsSortedObj[objKeys[i]].length; x += 1) {

            dateArray = [];
            currentEvent = eventsSortedObj[objKeys[i]][x];

            // Event dates might be array of start end
            for (let y = 0; y < currentEvent.date.length; y += 1) {
                dateArray.push(formatDateForWeb(currentEvent.date[y]));
            }

            if (currentEvent.extra) {
                extraLocationText = currentEvent.extra;
            } else {
                extraLocationText = '';
            }

            eventBoxTitle = [

                `${dateArray.join(` ${eventDateArrow} `)}<br><span class="normalWeightText">`,
                `${currentEvent.city},`,
                `${currentEvent.state}`,
                `${extraLocationText}`

            ].join(' ');

            if (eventsSortedObj[objKeys[i]].length - x !== 1) {
                extraPad = `\n${tabs}`;
            } else {
                extraPad = '';
            }
            
            newTag = 'replaceWithEvent';
            eventBoxes += makeTextBox(inFileStringMod, sectionTagSub, eventBoxTitle, true, newTag, true, eventBoxType);
            eventBoxes += extraPad;
            eventString = makeEventString(currentEvent, newTag, eventBoxes);
            eventBoxes = replaceTagWithContent(newTag, eventBoxes, eventString);

        }

        inFileStringMod = replaceTagWithContent(sectionTagSub, inFileStringMod, eventBoxes);

    }

    return inFileStringMod;

}

function processEventsShortSection(inFileString, sectionTag) {

    var allShortEvents;
    var inFileStringMod;
    var tabs;
    var firstYear;
    var lastYear;
    var sectionTitle;
    var shortEventsString;
    var dateArray;
    var performanceNumber;
    var outputFileString;
    var paragraphContainer;
    
    shortEventsString = '';
    inFileStringMod = inFileString;

    // Get all the events
    allShortEvents = eventsShortObjArr.eventsShort;

    // Sort chronologically
    allShortEvents = sortChronologically(allShortEvents);

    // Get first and last year of eventsShort array
    lastYear = allShortEvents[0].date[0].split('/')[2];
    firstYear = allShortEvents[(allShortEvents.length - 1)].date[0].split('/')[2];
    sectionTitle = firstYear + '–' + lastYear;

    // Make the text box that holds the short events list
    inFileStringMod = makeTextBox(inFileStringMod, sectionTag, sectionTitle, false);

    // Get tabs to start of paragraph container
    tabs = findSpIndentForSection(sectionTag, inFileStringMod);

    paragraphContainer = [

        '<p class="interviewPara">\n',
        `${tabs}${tab}<${sectionTag}>\n`,
        `${tabs}</p>`

    ].join('');
    
    inFileStringMod = replaceTagWithContent(sectionTag, inFileStringMod, paragraphContainer);

    // Get tabs to start of section
    tabs = findSpIndentForSection(sectionTag, inFileStringMod);

    // Loop through the events and build the HTML
    for (let i = 0; i < allShortEvents.length; i += 1) {
        
        dateArray = [];

        // Events may have start ened dates in array
        for (let y = 0; y < allShortEvents[i].date.length; y += 1) {
            dateArray.push(formatDateForWeb(allShortEvents[i].date[y]));
        }

        if (allShortEvents[i].performanceNumber) {
            performanceNumber = `(${allShortEvents[i].performanceNumber}) `;
        } else {
            performanceNumber = '';
        }

        shortEventsString += [

            '\n',
            `${tabs}<span class="article-date">${dateArray.join(` ${eventDateArrow} `)}</span>\n`,
            `${tabs}${tab}${hyphenTagStart}${allShortEvents[i].city}${hyphenTagEnd} &#8226;\n`,
            `${tabs}${tab}${performanceNumber}${hyphenTagStart}${addHyperlinks(allShortEvents[i].venue)}${hyphenTagEnd}\n`

        ].join('');

    }

    outputFileString = replaceTagWithContent(sectionTag, inFileStringMod, shortEventsString);

    return outputFileString;

}

function processScoresSection(inFileString, sectionTag) {

    var compositions;
    var boxTemp;
    var scoreContent;
    var boxTitle;
    var scoreBoxContents;
    var tabs;
    var inFileStringMod;
    var printScoreNumber;
    var contentTabs;
    var outputFileString;
    var scoresOverviewText;

    inFileStringMod = inFileString;

    compositions = compObjArr.compositions;
    scoreContent = '';
    printScoreNumber = 0;

    // Sort alphabetically
    compositions = sortAlphabetically(compositions);

    // Get tabs
    tabs = findSpIndentForSection(sectionTag, inFileStringMod);

    // Make the overview box
    scoresOverviewText = getSectionText('scoresOverview');
    boxTemp = makeTextBox(inFileStringMod, sectionTag, 'Overview', false, 'scoresOverview', true, null);
    scoreBoxContents = `<p class="infoBoxParaLast">${hyphenTagStart}${scoresOverviewText}${hyphenTagEnd}</p>`;    
    scoreContent += replaceTagWithContent('scoresOverview', boxTemp, scoreBoxContents);
    scoreContent += `\n${tabs}<div class="scoreDots centerIt">${interpunct}${interpunct}${interpunct}${interpunct}${interpunct}</div>`;

    // Loop through compositions
    for (let i = 0; i < compositions.length; i += 1) {

        if (compositions[i].score === 'print') {

            scoreBoxContents = [];
            
            boxTitle = [

                `${compositions[i].title} (${compositions[i].date[0]})`,
                '<br>',
                `<span class="normalWeightText">${compositions[i].for}</span>`

            ].join('');

            // Make the box
            boxTemp = makeTextBox(inFileStringMod, sectionTag, boxTitle, false, compositions[i].title, true, null);

            contentTabs = findSpIndentForSection(compositions[i].title, boxTemp);

            // Make score box contents
            scoreBoxContents.push('<p class="interviewPara">');

            if (compositions[i].composedFor) {
                scoreBoxContents.push([
                    
                    `${tab}<span class="article-date">${hyphenTagStart}Composed For${hyphenTagEnd}`,
                    `</span> ${hyphenTagStart}${addHyperlinks(compositions[i].composedFor)}${hyphenTagEnd}`

                ].join(''));
            }

            if (compositions[i].occasion) {

                scoreBoxContents.push([
                    
                    `${tab}<span class="article-date">${hyphenTagStart}Occasion${hyphenTagEnd}</span> `,
                    `${hyphenTagStart}${addHyperlinks(compositions[i].occasion)}${hyphenTagEnd}`

                ].join(''));

            }

            if (compositions[i].duration) {

                scoreBoxContents.push([
                    
                    `${tab}<span class="article-date">${hyphenTagStart}Duration${hyphenTagEnd}</span> `,
                    `${compositions[i].duration}`

                ].join(''));

            }

            if (compositions[i].mediaLinksOnWebsite) {

                scoreBoxContents.push(`${tab}<span class="article-date">Links</span>`);

                // Loop through links
                for (let y = 0; y < compositions[i].mediaLinksOnWebsite.length; y += 1) {

                    scoreBoxContents.push([

                        `${tab}${tab}<a href="${compositions[i].mediaLinksOnWebsite[y].url}" target="_blank">`,
                        `${hyphenTagStart}${compositions[i].mediaLinksOnWebsite[y].name}${hyphenTagEnd}</a>`

                    ].join(''));

                }

            }

            scoreBoxContents.push('</p>');

            // Loop through array and apply proper newlines and tabs
            for (let y = 0; y < scoreBoxContents.length; y += 1) {
                if (y > 0) scoreBoxContents[y] = `\n${contentTabs}${scoreBoxContents[y]}`;
            }

            boxTemp = replaceTagWithContent(compositions[i].title, boxTemp, scoreBoxContents.join(''));

            // Adjust the formatting
            if (printScoreNumber > 0) boxTemp = '\n' + tabs + boxTemp;

            scoreContent += boxTemp;

            printScoreNumber += 1;

        }
    }

    outputFileString = replaceTagWithContent(sectionTag, inFileStringMod, scoreContent);

    return outputFileString;

}

// ============================ //
//                              //
// START: MAIN PROCESSING QUEUE //
//                              //
// ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ //

//
// 01 Connect -- NOTE: Connect buttons best left in the template
//

//
// 02 Introduction
//
inputFileString = processAllTextSection(inputFileString, 'workDescription', false);
inputFileString = processAllTextSection(inputFileString, 'biography', false);
inputFileString = processArticlesAndInterviews(inputFileString, 'articlesAndInterviews', false);

//
// 03 Discography
//
inputFileString = processDiscography(inputFileString, 'discography');

//
// 04 Marimba++
//
inputFileString = processAllTextSection(inputFileString, 'marimbapp', false);
inputFileString = processMarCompWorks(inputFileString, 'mcWorks', false);

//
// 05 SSAL
//
inputFileString = processAllTextSection(inputFileString, 'ssalStudio', false);
inputFileString = processAllTextSection(inputFileString, 'ssalMMEDS', false);
inputFileString = processAllTextSection(inputFileString, 'ssalRecordings', false);
inputFileString = processAllTextSection(inputFileString, 'ssalSubDynamics', true);
inputFileString = processAllTextSection(inputFileString, 'ssalSubSpeakerSetup', true);
inputFileString = processAllTextSection(inputFileString, 'ssalSubPhysicalMedia', true);
inputFileString = processAllTextSection(inputFileString, 'ssalSubConcertPresentation', true);
inputFileString = processAllTextSection(inputFileString, 'ssalFMRP', false);
inputFileString = processFmrpWorksBox(inputFileString, 'ssalSubFMRPWorks', true);
inputFileString = processAllTextSection(inputFileString, 'ssalGARP', false);
inputFileString = processAllTextSection(inputFileString, 'ssalDonate', false);

//
// 06 Photo/Video -- NOTE: photo/video buttons best left in the template
//

//
// 07 Events
//
inputFileString = processEventsCompleteSection(inputFileString, 'eventsComplete');
inputFileString = processEventsShortSection(inputFileString, 'eventsShort');

//
// 08 Scores
//
inputFileString = processScoresSection(inputFileString, 'scores');

// ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑ //
//                            //
// END: MAIN PROCESSING QUEUE //
//                            //
// ========================== //

//
// Ultrahyphenate text
//
inputFileString = ultraHyphenate(inputFileString);

//
// Write the finished HTML file
//
fs.writeFileSync(outputFile, inputFileString);
