[Skip to main content](https://developers.google.com/workspace/calendar/api/guides/event-types#main-content)

[![Google Workspace](https://fonts.gstatic.com/s/i/productlogos/googleg/v6/16px.svg)](https://developers.google.com/workspace)

- [GoogleWorkspace](https://developers.google.com/workspace)

`/`

- [English](https://developers.google.com/workspace/calendar/api/guides/event-types)
- [Deutsch](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=de)
- [Español](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=es)
- [Español – América Latina](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=es-419)
- [Français](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=fr)
- [Indonesia](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=id)
- [Italiano](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=it)
- [Polski](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=pl)
- [Português – Brasil](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=pt-br)
- [Tiếng Việt](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=vi)
- [Türkçe](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=tr)
- [Русский](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=ru)
- [עברית](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=he)
- [العربيّة](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=ar)
- [فارسی](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=fa)
- [हिंदी](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=hi)
- [বাংলা](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=bn)
- [ภาษาไทย](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=th)
- [中文 – 简体](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=zh-cn)
- [中文 – 繁體](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=zh-tw)
- [日本語](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=ja)
- [한국어](https://developers.google.com/workspace/calendar/api/guides/event-types?hl=ko)

[Sign in](https://developers.google.com/_d/signin?continue=https%3A%2F%2Fdevelopers.google.com%2Fworkspace%2Fcalendar%2Fapi%2Fguides%2Fevent-types&prompt=select_account)

- [Google Calendar](https://developers.google.com/workspace/calendar)

- On this page
- [Default event](https://developers.google.com/workspace/calendar/api/guides/event-types#default)
- [Birthday](https://developers.google.com/workspace/calendar/api/guides/event-types#birthday)
- [Events from Gmail](https://developers.google.com/workspace/calendar/api/guides/event-types#from-gmail)
- [Focus time, out of office and working location](https://developers.google.com/workspace/calendar/api/guides/event-types#user-status)
- [Explore event types in Google Apps Script](https://developers.google.com/workspace/calendar/api/guides/event-types#apps-script)
  - [Create and set up the script](https://developers.google.com/workspace/calendar/api/guides/event-types#create-script)
  - [(Optional) Update the Google Cloud project](https://developers.google.com/workspace/calendar/api/guides/event-types#update-project)
  - [Add code to the script](https://developers.google.com/workspace/calendar/api/guides/event-types#add-code)
  - [Run the code sample](https://developers.google.com/workspace/calendar/api/guides/event-types#run-code)

- [Home](https://developers.google.com/)
- [Google Workspace](https://developers.google.com/workspace)
- [Google Calendar](https://developers.google.com/workspace/calendar)
- [Guides](https://developers.google.com/workspace/calendar/api/guides/overview)

Was this helpful?



 Send feedback



# Event types    bookmark\_borderbookmark   Stay organized with collections     Save and categorize content based on your preferences.

- On this page
- [Default event](https://developers.google.com/workspace/calendar/api/guides/event-types#default)
- [Birthday](https://developers.google.com/workspace/calendar/api/guides/event-types#birthday)
- [Events from Gmail](https://developers.google.com/workspace/calendar/api/guides/event-types#from-gmail)
- [Focus time, out of office and working location](https://developers.google.com/workspace/calendar/api/guides/event-types#user-status)
- [Explore event types in Google Apps Script](https://developers.google.com/workspace/calendar/api/guides/event-types#apps-script)
  - [Create and set up the script](https://developers.google.com/workspace/calendar/api/guides/event-types#create-script)
  - [(Optional) Update the Google Cloud project](https://developers.google.com/workspace/calendar/api/guides/event-types#update-project)
  - [Add code to the script](https://developers.google.com/workspace/calendar/api/guides/event-types#add-code)
  - [Run the code sample](https://developers.google.com/workspace/calendar/api/guides/event-types#run-code)

This page explains the `eventType` property, and specifications of event types
available in the Google Calendar API.

Google Calendar allows users to create generic events, as well as events that
are designed for specific use cases and with custom properties.

The event type can be discovered in the following places in the API:

- All events are returned with an [`eventType`](https://developers.google.com/workspace/calendar/api/v3/reference/events#eventType).
- [`eventType`](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert#eventType)
needs to be set when creating or updating an event resource. If unset,
`'default'` type will be used.
- [`eventTypes`](https://developers.google.com/workspace/calendar/api/v3/reference/events/list#eventTypes)
can be specified in an [`Events:list`](https://developers.google.com/workspace/calendar/api/v3/reference/events/list)
call to list events of specific types. If no type is specified, all event types
will be returned.
- [`eventTypes`](https://developers.google.com/workspace/calendar/api/v3/reference/events/watch#eventTypes)
can be specified in an [`Events:watch`](https://developers.google.com/workspace/calendar/api/v3/reference/events/watch)
call to subscribe to updates on events of specific types. If no type is
specified, the request will result in subscribing to all event types.

## Default event

Events with `default` event type are created and used as one of the main
resources of Google Calendar API. They support a wide range of
[properties](https://developers.google.com/workspace/calendar/api/v3/reference/events#properties)
which can be used to further customize the event.

See
[Create events](https://developers.google.com/workspace/calendar/api/guides/create-events) to start working with
Google Calendar events.

## Birthday

Birthdays are special all-day events with an annual recurrence.

Users can manually create birthday events on Google Calendar. In addition, the
birthday information syncs with Google Calendar when users add a person and
include their birthday and other significant dates in
[Google Contacts](https://contacts.google.com/). Users' own birthday is also
synced to Google Calendar from their
[Google Account profile](https://myaccount.google.com/profile).

Google Calendar API supports [`get`](https://developers.google.com/workspace/calendar/api/v3/reference/events/get),
[`instances`](https://developers.google.com/workspace/calendar/api/v3/reference/events/instances), and
[`list`](https://developers.google.com/workspace/calendar/api/v3/reference/events/list) methods for reading birthday
events. [`eventTypes`](https://developers.google.com/workspace/calendar/api/v3/reference/events/list#eventTypes) can be
set to `'birthday'` to list only birthday events. If no type is specified,
birthdays will be listed alongside all other event types.

In the returned `Event` objects, inspect the
[`birthdayProperties`](https://developers.google.com/workspace/calendar/api/v3/reference/events#birthdayProperties)
field for more details about this special event. `birthdayProperties` has the
following fields:

- [`type`](https://developers.google.com/workspace/calendar/api/v3/reference/events#birthdayProperties.type): Type of
this special event, whether it's a birthday, an anniversary, or another
significant date.
- [`customTypeName`](https://developers.google.com/workspace/calendar/api/v3/reference/events#birthdayProperties.customTypeName):
User-specified label for this special event. This is populated if `type` is
set to `'custom'`.
- [`contact`](https://developers.google.com/workspace/calendar/api/v3/reference/events#birthdayProperties.contact):
Resource name of the contact this special event is linked to, if any. This
has the format `'people/c12345'` and can be used to fetch contact details
from the [People API](https://developers.google.com/people).

The API allows creating birthday events using the
[`insert`](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert) method with the following
specifications:

- [`eventType`](https://developers.google.com/workspace/calendar/api/v3/reference/events#eventType) is set to
`'birthday'`.
- [`start`](https://developers.google.com/workspace/calendar/api/v3/reference/events#start) and
[`end`](https://developers.google.com/workspace/calendar/api/v3/reference/events#end) fields need to define an
all-day event which spans exactly one day.
- [`visibility`](https://developers.google.com/workspace/calendar/api/v3/reference/events#visibility) field value
must be `'private'`.
- [`transparency`](https://developers.google.com/workspace/calendar/api/v3/reference/events#transparency) field value
must be `'transparent'`.
- Need to have an annual recurrence, which means that the
[`recurrence`](https://developers.google.com/workspace/calendar/api/v3/reference/events#recurrence) field must be
`'RRULE:FREQ=YEARLY'`. Birthday events falling on 29th of February must have
the following recurrence rule:
`'RRULE:FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=-1'`.
- Can have a [`colorId`](https://developers.google.com/workspace/calendar/api/v3/reference/events#colorId),
[`summary`](https://developers.google.com/workspace/calendar/api/v3/reference/events#summary) and
[`reminders`](https://developers.google.com/workspace/calendar/api/v3/reference/events#reminders).
- Can have
[`birthdayProperties`](https://developers.google.com/workspace/calendar/api/v3/reference/events#birthdayProperties).
If specified,
[`type`](https://developers.google.com/workspace/calendar/api/v3/reference/events#birthdayProperties.type) must be
`'birthday'`, and both
[`customTypeName`](https://developers.google.com/workspace/calendar/api/v3/reference/events#birthdayProperties.customTypeName)
and
[`contact`](https://developers.google.com/workspace/calendar/api/v3/reference/events#birthdayProperties.contact)
must be empty.
- Cannot have any other event properties.

The API allows updating the
[`colorId`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update#colorId),
[`summary`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update#summary) and
[`reminders`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update#reminders) of birthday
events using the [`update`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update)
and [`patch`](https://developers.google.com/workspace/calendar/api/v3/reference/events/patch) methods.
[`start`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update#start) and
[`end`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update#end) fields can also be updated
to change the event date. In this case, the new values need to define an all-day
event which spans exactly one day. Timing details of a birthday event cannot be
updated if the event is linked to a
[`contact`](https://developers.google.com/workspace/calendar/api/v3/reference/events#birthdayProperties.contact), or
its [`type`](https://developers.google.com/workspace/calendar/api/v3/reference/events#birthdayProperties.type) is
`'self'`.

Google Calendar API doesn't allow creating birthday events with custom
[`birthdayProperties`](https://developers.google.com/workspace/calendar/api/v3/reference/events#birthdayProperties), or
updating these properties. Significant dates can be edited with the
[People API](https://developers.google.com/people), and the changes are synced with
Google Calendar. Similarly, users can edit their own birthday on their
[Google Account profile](https://myaccount.google.com/profile), and it syncs
with Google Calendar.

Requests that try to create or update a birthday in an unsupported way will
fail. In this case, inspect the error message to identify the issue.

The API supports [`import`](https://developers.google.com/workspace/calendar/api/v3/reference/events/import) operation
for birthday events; however, the event will be imported as a default event. In
other words, the [`eventType`](https://developers.google.com/workspace/calendar/api/v3/reference/events#eventType) will
be `'default'`.

The API supports the [`watch`](https://developers.google.com/workspace/calendar/api/v3/reference/events/watch) method
to subscribe to changes on birthday events on Google Calendar.
[`eventTypes`](https://developers.google.com/workspace/calendar/api/v3/reference/events/watch#eventTypes) can be set to
`'birthday'` to subscribe to updates on birthday events. If no type is
specified, all event types, including birthdays, will be subscribed to.

Birthday events can be deleted using the
[`delete`](https://developers.google.com/workspace/calendar/api/v3/reference/events/delete) method of the
Google Calendar API. Deleting a birthday event from Google Calendar doesn't
affect data on [Google Contacts](https://contacts.google.com/) or
[Google Account profile](https://myaccount.google.com/profile).

Changing the organizer of a birthday event using
[`move`](https://developers.google.com/workspace/calendar/api/v3/reference/events/move) or
[`update`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update) methods is not supported.

## Events from Gmail

Events [automatically generated from Gmail](https://support.google.com/calendar/answer/6084018)
have the `'fromGmail'` event type.

Google Calendar API doesn't allow creating this event type using the
[`insert`](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert) method.

The API allows updating the
[`colorId`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update#colorId),
[`reminders`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update#reminders),
[`visibility`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update#visibility),
[`transparency`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update#transparency),
[`status`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update#status),
[`attendees`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update#attendees),
[`private`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update#extendedProperties.private)
and [`shared`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update#extendedProperties.shared)
extended properties using the [`update`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update)
and [`patch`](https://developers.google.com/workspace/calendar/api/v3/reference/events/patch) methods.

The API supports [`get`](https://developers.google.com/workspace/calendar/api/v3/reference/events/get) and
[`list`](https://developers.google.com/workspace/calendar/api/v3/reference/events/list) methods for reading events from
Gmail. [`eventTypes`](https://developers.google.com/workspace/calendar/api/v3/reference/events/list#eventTypes) can be
set to `'fromGmail'` to list only events generated from Gmail. If no type is
specified, events from Gmail will be listed alongside all other event types.

The API supports the [`watch`](https://developers.google.com/workspace/calendar/api/v3/reference/events/watch) method
to subscribe to changes on events from Gmail on Google Calendar. If no type is
specified, all event types, including `'fromGmail'`, will be subscribed to.

Events from Gmail can be deleted using the
[`delete`](https://developers.google.com/workspace/calendar/api/v3/reference/events/delete) method of the
Google Calendar API.

Changing the organizer of an event from Gmail using
[`move`](https://developers.google.com/workspace/calendar/api/v3/reference/events/move) or
[`update`](https://developers.google.com/workspace/calendar/api/v3/reference/events/update) methods is not supported.

## Focus time, out of office and working location

The Google Calendar API can be used to create and manage events that show the
status of Google Calendar users.

These features are only available on primary calendars, and to some
Google Calendar users. See [Manage focus time, out of office, and working\\
location events](https://developers.google.com/workspace/calendar/api/guides/calendar-status) to learn more.

## Explore event types in Google Apps Script

[Google Apps Script](https://developers.google.com/apps-script/overview) is a JavaScript-based cloud
scripting language that lets you build business applications that integrate with
Google Workspace. Scripts are developed in a browser-based code editor, and
they are stored and run on Google's servers. See also [Google Apps Script\\
quickstart](https://developers.google.com/workspace/calendar/api/quickstart/apps-script) to start using
Apps Script to send requests to the Google Calendar API.

The following instructions describe how to read and manage events using the
[Google Calendar API](https://developers.google.com/apps-script/advanced/calendar) as an advanced service in
Google Apps Script. For a complete list of Google Calendar API resources and methods,
see the [reference documentation](https://developers.google.com/workspace/calendar/api/guides/overview).

### Create and set up the script

1. Create a script by going to
[script.google.com/create](https://script.google.com/create).
2. On the left pane next to **Services**, click Add a service
add .
3. Select **Google Calendar API** and click **Add**.
4. After enabled, the API appears on the left pane. Available methods and
classes in the API can be listed using the _Calendar_ keyword in the editor.

### (Optional) Update the Google Cloud project

Each Google Apps Script project has an associated Google Cloud project. Your
script can use the default project that Google Apps Script automatically
creates. If you want to use a custom Google Cloud project, see [Switch to a\\
different standard Cloud project](https://developers.google.com/apps-script/guides/cloud-platform-projects#switch_to_a_different_standard).
After setting the Google Cloud project, select **Editor** code on the left side to navigate back to the
code editor.

### Add code to the script

The following code sample shows how to list, read, and create events with
different `eventType` values.

1. Paste the following into the code editor.








```
const CALENDAR_ID = 'CALENDAR_ID' || 'primary';

/** Lists default events. */
function listDefaultEvents() {
     listEvents('default');
}

/** Lists birthday events. */
function listBirthdays() {
     listEvents('birthday');
}

/** Lists events from Gmail. */
function listEventsFromGmail() {
     listEvents('fromGmail');
}

/**
     * Lists events with the given event type. If no type is specified, lists all events.
     * See https://developers.google.com/workspace/calendar/api/v3/reference/events/list
     */
function listEvents(eventType = undefined) {
     // Query parameters for the list request.
     const optionalArgs = {
       eventTypes: eventType ? [eventType] : undefined,
       singleEvents: true,
       timeMax: '2024-07-30T00:00:00+01:00',
       timeMin: '2024-07-29T00:00:00+01:00',
     }
     try {
       var response = Calendar.Events.list(CALENDAR_ID, optionalArgs);
       response.items.forEach(event => console.log(event));
     } catch (exception) {
       console.log(exception.message);
     }
}

/**
     * Reads the event with the given eventId.
     * See https://developers.google.com/workspace/calendar/api/v3/reference/events/get
     */
function readEvent() {
     try {
       var response = Calendar.Events.get(CALENDAR_ID, 'EVENT_ID');
       console.log(response);
     } catch (exception) {
       console.log(exception.message);
     }
}

/** Creates a default event. */
function createDefaultEvent() {
     const event = {
       start: { dateTime: '2024-07-30T10:30:00+01:00'},
       end: { dateTime: '2024-07-30T12:30:00+01:00'},
       description: 'Created from Apps Script.',
       eventType: 'default',
       summary: 'Sample event',
     }
     createEvent(event);
}

/** Creates a birthday event. */
function createBirthday() {
     const event = {
       start: { date: '2024-01-29' },
       end: { date: '2024-01-30' },
       eventType: 'birthday',
       recurrence: ["RRULE:FREQ=YEARLY"],
       summary: "My friend's birthday",
       transparency: "transparent",
       visibility: "private",
     }
     createEvent(event);
}

/**
     * Creates a Calendar event.
     * See https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
     */
function createEvent(event) {

     try {
       var response = Calendar.Events.insert(event, CALENDAR_ID);
       console.log(response);
     } catch (exception) {
       console.log(exception.message);
     }
}

```


Replace the following:

   - `CALENDAR_ID`: Email address of the calendar to
     retrieve and create events on. This constant is initially set to
     `'primary'`, which is a keyword to access the primary calendar of the
     signed-in user. Changing this value lets you read events on the calendars of
     other users you have access to.
   - `EVENT_ID`: Id of the event. You can call the
     [Events:list](https://developers.google.com/workspace/calendar/api/v3/reference/events/list) to retrieve event ids.

### Run the code sample

1. Above the code editor, select the function to run from the drop-down menu,
and click **Run**.
2. In the first execution, it prompts you to authorize access. Review and allow
Apps Script to access your calendar.
3. You can inspect the results of the script execution in the
**Execution Log** that appears at the bottom of the window.

Was this helpful?



 Send feedback



Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2025-05-07 UTC.

Info


Chat


API


## Page info

bug\_reportfullscreenclose\_fullscreenclose

### On this page

- On this page
- [Default event](https://developers.google.com/workspace/calendar/api/guides/event-types#default)
- [Birthday](https://developers.google.com/workspace/calendar/api/guides/event-types#birthday)
- [Events from Gmail](https://developers.google.com/workspace/calendar/api/guides/event-types#from-gmail)
- [Focus time, out of office and working location](https://developers.google.com/workspace/calendar/api/guides/event-types#user-status)
- [Explore event types in Google Apps Script](https://developers.google.com/workspace/calendar/api/guides/event-types#apps-script)
  - [Create and set up the script](https://developers.google.com/workspace/calendar/api/guides/event-types#create-script)
  - [(Optional) Update the Google Cloud project](https://developers.google.com/workspace/calendar/api/guides/event-types#update-project)
  - [Add code to the script](https://developers.google.com/workspace/calendar/api/guides/event-types#add-code)
  - [Run the code sample](https://developers.google.com/workspace/calendar/api/guides/event-types#run-code)

### Tags

[iframe](https://feedback-pa.clients6.google.com/static/proxy.html?usegapi=1&jsh=m%3B%2F_%2Fscs%2Fabc-static%2F_%2Fjs%2Fk%3Dgapi.lb.en.UrDN-rBnMgo.O%2Fd%3D1%2Frs%3DAHpOoo8Lt5m-Nn72_E0-4M58GbbhD_y7Yw%2Fm%3D__features__#parent=https%3A%2F%2Fdevelopers.google.com&rpctoken=360436798)