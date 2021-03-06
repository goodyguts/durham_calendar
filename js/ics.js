import {DateTime} from 'luxon';
import { v4 as uuidv4 } from 'uuid';

function foldLine (line) {
  const parts = []
  let length = 75
  while (line.length > length) {
    parts.push(line.slice(0, length))
    line = line.slice(length)
    length = 74
  }
  parts.push(line)
  return parts.join('\n ')
}

function formatText (text) {
  return text
    .replace(/\\/gm, "\\\\")
    .replace(/\r?\n/gm, "\\n")
    .replace(/;/gm, "\\;")
    .replace(/,/gm, "\\,")
}

const replace_regex = /[^\dT]/g;
function changeTiming(timing_dt) {
  return timing_dt.replace(replace_regex, '').slice(0, 15)
}

function getCategory (type) {
  switch (type.substr(0, 3)) {
    case 'LEC':
      return 'Lecture'
    case 'TUT':
      return 'Tutorial'
    case 'SEM':
      return 'Seminar'
    case 'PRO':
      return 'Problems Class'
    case 'PRA':
      return 'Practical'
  }

  return 'Other'
}

export function generateICSString (modules, icalColorChoice) {
  let events = [];
  const timestamp_now = DateTime.utc().set({milliseconds: 0}).toISO({suppressMilliseconds: true, format: 'basic'});
  modules.forEach(
    module => module.activities.forEach(
      activity => activity.final_timings.forEach(
        timing => {
          let categoriesLine = "";
          if(icalColorChoice === "Activity"){
            categoriesLine = "\n" + foldLine('CATEGORIES:' + formatText(getCategory(activity.type)));
          } else if (icalColorChoice === "Module") {
            categoriesLine = "\n" + foldLine('CATEGORIES:' + formatText(module.code));
          }
          events.push(
`BEGIN:VEVENT
${foldLine('SUMMARY:' + formatText(activity.title))}
DTSTART;TZID=Europe/London:${changeTiming(timing.start.dateTime)}
DTEND;TZID=Europe/London:${changeTiming(timing.end.dateTime)}
DTSTAMP:${timestamp_now}
${foldLine('UID:' + uuidv4() + '@goodyguts.github.io')}
CREATED:${timestamp_now}
${foldLine('LOCATION:' + formatText(activity.room))}
${foldLine('DESCRIPTION:' + formatText(activity.cal_description))}${categoriesLine}
END:VEVENT`
          )
        })));

  return (
`BEGIN:VCALENDAR
PRODID:-//goodyguts//Durham Calendar//EN
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VTIMEZONE
TZID:Europe/London
X-LIC-LOCATION:Europe/London
BEGIN:DAYLIGHT
TZOFFSETFROM:+0000
TZOFFSETTO:+0100
TZNAME:BST
DTSTART:19700329T010000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0100
TZOFFSETTO:+0000
TZNAME:GMT
DTSTART:19701025T020000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
${events.join('\n')}
END:VCALENDAR`.replace(/\n/g, '\r\n')
  )
}
