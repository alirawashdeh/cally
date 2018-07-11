"use strict";
var AFTERNOON_TIME = 14;
var EVENING_TIME = 20;
var MORNING_TIME = 10;
var MIDDAY_TIME = 12;

function Cally(text, currentdate) {

  this.startdate = currentdate;
  this.enddate = currentdate;
  this.allday = false;

  this.datefound = false;
  this.starttimefound = false;
  this.endtimefound = false;

  this.subject = "";
  this.subjectfound = false;

  this.pmKeywordFound = false; // set to true if "afternoon, evening, tonight" keywords found

  var subjectstart = 0;
  var subjectend;

  this.textString = "";
  this.textStringLower = "";

  this.parse = function() {
    if (this.textString.length > 0) {
      this.findDayOfWeek(); //e.g. Monday Tuesday
      if (!this.datefound) {
        this.findDateKeyword(); //e.g. Tonight, Tomorrow, Next Year, in 1 month
      }
      this.findDateAndMonth();
      this.findTimeKeyword(); // e.g. evening, morning, in 1 hour
      this.findTimeNumber(); // e.g. 3PM, 15:00

      this.enddate = new Date(this.startdate);

      this.findDuration(); // e.g. for 2 hours
      this.findAllDayKeyword(); // e.g. all day
      this.populateSubject(); // e.g. 'Meet John'
    }

    if (this.starttimefound === false) {
      this.startdate.setHours(0, 0, 0, 0);
    }
    if (this.endtimefound === false) {
      this.enddate.setHours(0, 0, 0, 0);
    }
  };


  // Find day of week e.g. Monday, Mon, Tuesday etc.
  this.findDayOfWeek = function() {
    var foundDay = -1;

    var regexSundayPos = this.textStringLower.search(/([^a-z]+|^)(on |this )*(sun|sunday)([^a-z]+|$)/);
    var regexMondayPos = this.textStringLower.search(/([^a-z]+|^)(on |this )*(monday|mon)([^a-z]+|$)/);
    var regexTuesdayPos = this.textStringLower.search(/([^a-z]+|^)(on |this )*(tuesday|tues|tue)([^a-z]+|$)/);
    var regexWednesdayPos = this.textStringLower.search(/([^a-z]+|^)(on |this )*(wednesday|wed)([^a-z]+|$)/);
    var regexThursdayPos = this.textStringLower.search(/([^a-z]+|^)(on |this )*(thursday|thurs|thur|thu)([^a-z]+|$)/);
    var regexFridayPos = this.textStringLower.search(/([^a-z]+|^)(on |this )*(friday|fri)([^a-z]+|$)/);
    var regexSaturdayPos = this.textStringLower.search(/([^a-z]+|^)(on |this )*(saturday|sat)([^a-z]+|$)/);

    var nextFound = false;

    if (regexSundayPos > -1) {
      foundDay = 0;
      this.setSubjectEndPos(regexSundayPos);
      nextFound = this.findNext(regexSundayPos);
    } else {
      if (regexMondayPos > -1) {
        foundDay = 1;
        this.setSubjectEndPos(regexMondayPos);
        nextFound = this.findNext(regexMondayPos);
      } else {
        if (regexTuesdayPos > -1) {
          foundDay = 2;
          this.setSubjectEndPos(regexTuesdayPos);
          nextFound = this.findNext(regexTuesdayPos);
        } else {
          if (regexWednesdayPos > -1) {
            foundDay = 3;
            this.setSubjectEndPos(regexWednesdayPos);
            nextFound = this.findNext(regexWednesdayPos);
          } else {
            if (regexThursdayPos > -1) {
              foundDay = 4;
              this.setSubjectEndPos(regexThursdayPos);
              nextFound = this.findNext(regexThursdayPos);
            } else {
              if (regexFridayPos > -1) {
                foundDay = 5;
                this.setSubjectEndPos(regexFridayPos);
                nextFound = this.findNext(regexFridayPos);
              } else {
                if (regexSaturdayPos > -1) {
                  foundDay = 6;
                  this.setSubjectEndPos(regexSaturdayPos);
                  nextFound = this.findNext(regexSaturdayPos);
                }
              }
            }
          }
        }
      }
    }
    if (foundDay > -1) {
      this.setDayOfWeek(foundDay, nextFound);
    }
  };

  // returns true if the word "next" appears immediately prior to the position supplied
  // used for e.g. "next Monday"
  this.findNext = function(dayPos) {
    var regexNextPos = this.textStringLower.substring(0, dayPos + 1).search(/(next )$/);
    if (regexNextPos > -1) {
      this.setSubjectEndPos(regexNextPos);
      return true;
    }
    return false;
  };

  // Sets day of week, e.g. "0" for Sunday, "1" for Monday
  this.setDayOfWeek = function(day, nextFound) {
    var defaultDate = this.startdate ? this.startdate : new Date();
    var currentDay = defaultDate.getDay();
    var diff = 0; // Number of days away the found day is

    if (currentDay >= day) {
      diff = day + 7 - currentDay;
    } else {
      diff = day - currentDay;
    }

    if (nextFound) {
      // if it's a Saturday, all but "next sat" should be >7 days away
      if ((currentDay == 6)) {
        if (diff < 7) {
          diff = diff + 7;
        }
      } else {
        // if it's a sunday, all but "next sat" / "next sun" is >7 days away
        if ((currentDay === 0)) {
          if (diff < 6) {
            diff = diff + 7;
          }
        } else {
          // if found day is past Saturday, add 7 days
          if (diff < (8 - currentDay)) {
            diff = diff + 7;
          }
        }
      }

    }
    defaultDate.setDate(defaultDate.getDate() + diff);
    this.startdate = defaultDate;
    this.datefound = true;
  };

  // Find date and month - e.g. on 12th November
  this.findDateAndMonth = function() {

    var regexJanMatch = /([^a-z0-9]+|^)(on |on the )?([1-9][0-9]*)(st|nd|rd|th)?( of)?( jan| january)([^a-z]+|$)/;
    var regexJanPos = this.textStringLower.search(regexJanMatch);
    var regexFebMatch = /([^a-z0-9]+|^)(on |on the )?([1-9][0-9]*)(st|nd|rd|th)?( of)?( feb| february)([^a-z]+|$)/;
    var regexFebPos = this.textStringLower.search(regexFebMatch);
    var regexMarMatch = /([^a-z0-9]+|^)(on |on the )?([1-9][0-9]*)(st|nd|rd|th)?( of)?( mar| march)([^a-z]+|$)/;
    var regexMarPos = this.textStringLower.search(regexMarMatch);
    var regexAprMatch = /([^a-z0-9]+|^)(on |on the )?([1-9][0-9]*)(st|nd|rd|th)?( of)?( apr| april)([^a-z]+|$)/;
    var regexAprPos = this.textStringLower.search(regexAprMatch);
    var regexMayMatch = /([^a-z0-9]+|^)(on |on the )?([1-9][0-9]*)(st|nd|rd|th)?( of)?( may| may)([^a-z]+|$)/;
    var regexMayPos = this.textStringLower.search(regexMayMatch);
    var regexJunMatch = /([^a-z0-9]+|^)(on |on the )?([1-9][0-9]*)(st|nd|rd|th)?( of)?( jun| june)([^a-z]+|$)/;
    var regexJunPos = this.textStringLower.search(regexJunMatch);
    var regexJulMatch = /([^a-z0-9]+|^)(on |on the )?([1-9][0-9]*)(st|nd|rd|th)?( of)?( jul| july)([^a-z]+|$)/;
    var regexJulPos = this.textStringLower.search(regexJulMatch);
    var regexAugMatch = /([^a-z0-9]+|^)(on |on the )?([1-9][0-9]*)(st|nd|rd|th)?( of)?( aug| august)([^a-z]+|$)/;
    var regexAugPos = this.textStringLower.search(regexAugMatch);
    var regexSepMatch = /([^a-z0-9]+|^)(on |on the )?([1-9][0-9]*)(st|nd|rd|th)?( of)?( sep| september)([^a-z]+|$)/;
    var regexSepPos = this.textStringLower.search(regexSepMatch);
    var regexOctMatch = /([^a-z0-9]+|^)(on |on the )?([1-9][0-9]*)(st|nd|rd|th)?( of)?( oct| october)([^a-z]+|$)/;
    var regexOctPos = this.textStringLower.search(regexOctMatch);
    var regexNovMatch = /([^a-z0-9]+|^)(on |on the )?([1-9][0-9]*)(st|nd|rd|th)?( of)?( nov| november)([^a-z]+|$)/;
    var regexNovPos = this.textStringLower.search(regexNovMatch);
    var regexDecMatch = /([^a-z0-9]+|^)(on |on the )?([1-9][0-9]*)(st|nd|rd|th)?( of)?( dec| december)([^a-z]+|$)/;
    var regexDecPos = this.textStringLower.search(regexDecMatch);

    var newDate;
    var found = false;
    var matches = null;

    if (regexJanPos > -1) {
      found = true;
      matches = this.textStringLower.match(regexJanMatch);
      if (!!matches[3]) {
        newDate = new Date(this.startdate.getFullYear(), 0, Number(matches[3]));
      }
      this.setSubjectEndPos(regexJanPos);
      //("Date and Month found: January");
    } else {
      if (regexFebPos > -1) {
        found = true;
        matches = this.textStringLower.match(regexFebMatch);
        if (!!matches[3]) {
          newDate = new Date(this.startdate.getFullYear(), 1, Number(matches[3]));
        }
        this.setSubjectEndPos(regexFebPos);
      } else {
        if (regexMarPos > -1) {
          found = true;
          matches = this.textStringLower.match(regexMarMatch);
          if (!!matches[3]) {
            newDate = new Date(this.startdate.getFullYear(), 2, Number(matches[3]));
          }
          this.setSubjectEndPos(regexMarPos);
        } else {
          if (regexAprPos > -1) {
            found = true;
            matches = this.textStringLower.match(regexAprMatch);
            if (!!matches[3]) {
              newDate = new Date(this.startdate.getFullYear(), 3, Number(matches[3]));
            }
            this.setSubjectEndPos(regexAprPos);
          } else {
            if (regexMayPos > -1) {
              found = true;
              matches = this.textStringLower.match(regexMayMatch);
              if (!!matches[3]) {
                newDate = new Date(this.startdate.getFullYear(), 4, Number(matches[3]));
              }
              this.setSubjectEndPos(regexMayPos);
            } else {
              if (regexJunPos > -1) {
                found = true;
                matches = this.textStringLower.match(regexJunMatch);
                if (!!matches[3]) {
                  newDate = new Date(this.startdate.getFullYear(), 5, Number(matches[3]));
                }
                this.setSubjectEndPos(regexJunPos);
              } else {
                if (regexJulPos > -1) {
                  found = true;
                  matches = this.textStringLower.match(regexJulMatch);
                  if (!!matches[3]) {
                    newDate = new Date(this.startdate.getFullYear(), 6, Number(matches[3]));
                  }
                  this.setSubjectEndPos(regexJulPos);
                } else {
                  if (regexAugPos > -1) {
                    found = true;
                    matches = this.textStringLower.match(regexAugMatch);
                    if (!!matches[3]) {
                      newDate = new Date(this.startdate.getFullYear(), 7, Number(matches[3]));
                    }
                    this.setSubjectEndPos(regexAugPos);
                  } else {
                    if (regexSepPos > -1) {
                      found = true;
                      matches = this.textStringLower.match(regexSepMatch);
                      if (!!matches[3]) {
                        newDate = new Date(this.startdate.getFullYear(), 8, Number(matches[3]));
                      }
                      this.setSubjectEndPos(regexSepPos);
                    } else {
                      if (regexOctPos > -1) {
                        found = true;
                        matches = this.textStringLower.match(regexOctMatch);
                        if (!!matches[3]) {
                          newDate = new Date(this.startdate.getFullYear(), 9, Number(matches[3]));
                        }
                        this.setSubjectEndPos(regexOctPos);
                      } else {
                        if (regexNovPos > -1) {
                          found = true;
                          matches = this.textStringLower.match(regexNovMatch);
                          if (!!matches[3]) {
                            newDate = new Date(this.startdate.getFullYear(), 10, Number(matches[3]));
                          }
                          this.setSubjectEndPos(regexNovPos);
                        } else {
                          if (regexDecPos > -1) {
                            found = true;
                            matches = this.textStringLower.match(regexDecMatch);
                            if (!!matches[3]) {
                              newDate = new Date(this.startdate.getFullYear(), 11, Number(matches[3]));
                            }
                            this.setSubjectEndPos(regexDecPos);
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    if (found) {
      this.datefound = true;
      if (newDate < this.startdate) {
        this.startdate.setFullYear(newDate.getFullYear() + 1);
      }
      this.startdate.setDate(newDate.getDate());
      this.startdate.setMonth(newDate.getMonth());

    }
  };

  // Find date keyword - e.g. Today, Tomorrow, Next Week
  this.findDateKeyword = function() {
    var defaultDate = this.startdate ? this.startdate : new Date();

    var regexTodayPos = this.textStringLower.search(/([^a-z]+|^)(today)([^a-z]+|$)/);
    var regexTomorrowPos = this.textStringLower.search(/([^a-z]+|^)(tomorrow)([^a-z]+|$)/);
    var regexThisAfternoonPos = this.textStringLower.search(/([^a-z]+|^)(this afternoon)([^a-z]+|$)/);
    var regexTonightPos = this.textStringLower.search(/([^a-z]+|^)(tonight)|(this evening)([^a-z]+|$)/);
    var regexInTheMorningPos = this.textStringLower.search(/([^a-z]+|^)(in the morning)([^a-z]+|$)/);
    var regexNextWeekPos = this.textStringLower.search(/([^a-z]+|^)(next week)([^a-z]+|$)/);
    var regexNextMonthPos = this.textStringLower.search(/([^a-z]+|^)(next month)([^a-z]+|$)/);
    var regexNextYearPos = this.textStringLower.search(/([^a-z]+|^)(next year)([^a-z]+|$)/);
    var regexInXDaysMatch = /([^a-z]+|^)(in )([1-9][0-9]*)( days| day)([^a-z]+|$)/;
    var regexInXDaysPos = this.textStringLower.search(regexInXDaysMatch);
    var regexInXWeeksMatch = /([^a-z]+|^)(in )([1-9][0-9]*)( weeks| week)([^a-z]+|$)/;
    var regexInXWeeksPos = this.textStringLower.search(regexInXWeeksMatch);
    var regexInXMonthsMatch = /([^a-z]+|^)(in )([1-9][0-9]*)( months| month)([^a-z]+|$)/;
    var regexInXMonthsPos = this.textStringLower.search(regexInXMonthsMatch);
    var regexInXYearsMatch = /([^a-z]+|^)(in )([1-9][0-9]*)( years| year)([^a-z]+|$)/;
    var regexInXYearsPos = this.textStringLower.search(regexInXYearsMatch);
    var matches;

    if (regexTodayPos > -1) {
      // Keep the default date.
      this.datefound = true;
      this.setSubjectEndPos(regexTodayPos);
    } else {
      if (regexTomorrowPos > -1) {
        this.startdate.setDate(defaultDate.getDate() + 1);
        this.datefound = true;
        this.setSubjectEndPos(regexTomorrowPos);
      } else {
        if (regexThisAfternoonPos > -1) {
          // Keep the default date
          this.datefound = true;
          this.starttimefound = true;
          this.startdate.setHours(AFTERNOON_TIME, 0, 0, 0);
          this.setSubjectEndPos(regexThisAfternoonPos);
          this.pmKeywordFound = true;
        } else {
          if (regexTonightPos > -1) {
            // Keep the default date
            this.datefound = true;
            this.starttimefound = true;
            this.startdate.setHours(EVENING_TIME, 0, 0, 0);
            this.setSubjectEndPos(regexTonightPos);
            this.pmKeywordFound = true;
          } else {
            if (regexInTheMorningPos > -1) {
              this.datefound = true;
              this.starttimefound = true;
              this.startdate.setDate(defaultDate.getDate() + 1);
              this.startdate.setHours(MORNING_TIME, 0, 0, 0);
              this.setSubjectEndPos(regexInTheMorningPos);
            } else {
              if (regexNextWeekPos > -1) {
                this.datefound = true;
                this.startdate.setDate(defaultDate.getDate() + 7);
                this.setSubjectEndPos(regexNextWeekPos);
              } else {
                if (regexNextMonthPos > -1) {
                  this.datefound = true;
                  this.startdate.setMonth(defaultDate.getMonth() + 1);
                  this.setSubjectEndPos(regexNextMonthPos);
                } else {
                  if (regexNextYearPos > -1) {
                    this.datefound = true;
                    this.startdate.setFullYear(defaultDate.getFullYear() + 1);
                    this.setSubjectEndPos(regexNextYearPos);
                  } else {
                    if (regexInXDaysPos > -1) {
                      this.datefound = true;

                      matches = this.textStringLower.match(regexInXDaysMatch);
                      if (!!matches[3]) {
                        this.datefound = true;
                        this.startdate.setDate(defaultDate.getDate() + Number(matches[3]));
                      }
                      this.setSubjectEndPos(regexInXDaysPos);
                    } else {
                      if (regexInXWeeksPos > -1) {
                        this.datefound = true;

                        matches = this.textStringLower.match(regexInXWeeksMatch);
                        if (!!matches[3]) {
                          this.datefound = true;
                          this.startdate.setDate(defaultDate.getDate() + (Number(matches[3]) * 7));
                        }
                        this.setSubjectEndPos(regexInXWeeksPos);
                      } else {
                        if (regexInXMonthsPos > -1) {
                          this.datefound = true;

                          matches = this.textStringLower.match(regexInXMonthsMatch);
                          if (!!matches[3]) {
                            this.datefound = true;
                            this.startdate.setMonth(defaultDate.getMonth() + Number(matches[3]));
                          }
                          this.setSubjectEndPos(regexInXMonthsPos);
                        } else {
                          if (regexInXYearsPos > -1) {
                            this.datefound = true;

                            matches = this.textStringLower.match(regexInXYearsMatch);
                            if (!!matches[3]) {
                              this.datefound = true;
                              this.startdate.setFullYear(defaultDate.getFullYear() + Number(matches[3]));
                            }
                            this.setSubjectEndPos(regexInXYearsPos);
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  // Find time keyword - e.g. Morning, Afternoon, Evening
  this.findTimeKeyword = function() {
    var regexMorningPos = this.textStringLower.search(/([^a-z]+|^)(morning)([^a-z]+|$)/);
    var regexAfternoonPos = this.textStringLower.search(/([^a-z]+|^)(afternoon)([^a-z]+|$)/);
    var regexNightPos = this.textStringLower.search(/([^a-z]+|^)(night)|(evening)([^a-z]+|$)/);
    var regexNoonPos = this.textStringLower.search(/([^a-z]+|^)(noon)|(midday)([^a-z]+|$)/);
    var regexInXHoursMatch = /([^a-z]+|^)(in )([1-9][0-9]*)( hours| hour)([^a-z]+|$)/;
    var regexInXHoursPos = this.textStringLower.search(regexInXHoursMatch);
    var regexInXMinutesMatch = /([^a-z]+|^)(in )([1-9][0-9]*)( minutes| minute)([^a-z]+|$)/;
    var regexInXMinutesPos = this.textStringLower.search(regexInXMinutesMatch);
    var matches;

    if (regexMorningPos > -1) {
      this.starttimefound = true;
      this.startdate.setHours(MORNING_TIME, 0, 0, 0);
      this.setSubjectEndPos(regexMorningPos);
    } else {
      if (regexAfternoonPos > -1) {
        this.starttimefound = true;
        this.startdate.setHours(AFTERNOON_TIME, 0, 0, 0);
        this.setSubjectEndPos(regexAfternoonPos);
        this.pmKeywordFound = true;
      } else {
        if (regexNightPos > -1) {
          this.starttimefound = true;
          this.startdate.setHours(EVENING_TIME, 0, 0, 0);
          this.setSubjectEndPos(regexNightPos);
          this.pmKeywordFound = true;
        } else {
          if (regexNoonPos > -1) {
            this.starttimefound = true;
            this.startdate.setHours(MIDDAY_TIME, 0, 0, 0);
            this.setSubjectEndPos(regexNoonPos);
          } else {
            if (regexInXHoursPos > -1) {
              matches = this.textStringLower.match(regexInXHoursMatch);
              if (!!matches[3]) {
                this.starttimefound = true;
                this.startdate.setHours(this.startdate.getHours() + Number(matches[3]));
              }
              this.setSubjectEndPos(regexInXHoursPos);
            } else {
              if (regexInXMinutesPos > -1) {
                matches = this.textStringLower.match(regexInXMinutesMatch);
                if (!!matches[3]) {
                  this.starttimefound = true;
                  this.startdate.setMinutes(this.startdate.getMinutes() + Number(matches[3]));
                }
                this.setSubjectEndPos(regexInXMinutesPos);
              }
            }
          }
        }
      }
    }
  };

  // Find time number - e.g. 3PM, 15:00
  this.findTimeNumber = function() {

    var expressionPrefix = "([^a-z]+|^)(at |starting at )";
    var expressionSuffix = "([^a-z]+|$)";
    var regexAtNumberPMPos = this.textStringLower.search(expressionPrefix + "*[0-1]*[0-9](:[0-5][0-9])?(pm| pm)" + expressionSuffix);
    var regexAtNumberAMPos = this.textStringLower.search(expressionPrefix + "*[0-1]*[0-9](:[0-5][0-9])?(am| am)"+ expressionSuffix);
    var regexAtNumber24HrPos = this.textStringLower.search(expressionPrefix + "*[0-2]*[0-9](:[0-5][0-9])" + expressionSuffix);
    var regex4DigitTimePos = this.textStringLower.search(expressionPrefix + "*[0-2][0-9]([0-5][0-9])" + expressionSuffix);
    var regexAtNumberPMorAMMatch = /([0-1]*[0-9])(:([0-5][0-9]))?( pm|pm| am|am)/;
    var regexAtNumberMatch = /([0-2]*[0-9])(:([0-5][0-9]))/;
    var regex4DigitMatch = /([0-2][0-9])([0-5][0-9])/;
    var regex2DigitMatch = expressionPrefix + "([0-1]*[0-9])" + expressionSuffix;
    var regex2DigitTimePos = this.textStringLower.search(regex2DigitMatch);
    var regexHalfPastMatch = expressionPrefix + "*(half past |half )([1-9][0-9]*)" + expressionSuffix;
    var regexHalfPastPos = this.textStringLower.search(regexHalfPastMatch);
    var regexQuarterPastMatch = expressionPrefix + "*(quarter past )([1-9][0-9]*)" + expressionSuffix;
    var regexQuarterPastPos = this.textStringLower.search(regexQuarterPastMatch);
    var regexQuarterToMatch = expressionPrefix + "*(quarter to )([1-9][0-9]*)" + expressionSuffix;
    var regexQuarterToPos = this.textStringLower.search(regexQuarterToMatch);
    var regexTimeNumberWordMatch = expressionPrefix + "(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(am| am)?(pm| pm)?" + expressionSuffix;
    var regexTimeNumberWordPos = this.textStringLower.search(regexTimeNumberWordMatch);

    var matches;
    var hours = 0;

    if (regexAtNumberPMPos > -1) {
      this.starttimefound = true;
      matches = this.textStringLower.match(regexAtNumberPMorAMMatch);
      hours = Number(matches[1]) + 12;
      if (hours == 24) {
        hours = 12;
      }
      this.startdate.setHours(hours, 0, 0, 0);
      if (!!matches[3]) {
        this.startdate.setMinutes(Number(matches[3]));
      }
      this.setSubjectEndPos(regexAtNumberPMPos);
    } else {
      if (regexAtNumberAMPos > -1) {
        this.starttimefound = true;
        matches = this.textStringLower.match(regexAtNumberPMorAMMatch);
        hours = Number(matches[1]);
        if (hours == 12) {
          hours = 0;
        }
        this.startdate.setHours(hours, 0, 0, 0);
        if (!!matches[3]) {
          this.startdate.setMinutes(Number(matches[3]));
        }
        this.setSubjectEndPos(regexAtNumberAMPos);
      } else {
        if (regexAtNumber24HrPos > -1) {
          this.starttimefound = true;
          matches = this.textStringLower.match(regexAtNumberMatch);
          hours = Number(matches[1]);
          this.startdate.setHours(hours, 0, 0, 0);
          if (!!matches[3]) {
            this.startdate.setMinutes(Number(matches[3]));
          }
          this.setSubjectEndPos(regexAtNumber24HrPos);
        } else {
          if (regex4DigitTimePos > -1) {
            this.starttimefound = true;
            matches = this.textStringLower.match(regex4DigitMatch);
            hours = Number(matches[1]);
            this.startdate.setHours(hours, 0, 0, 0);
            if (matches[2] !== null) {
              this.startdate.setMinutes(Number(matches[2]));
            }
            this.setSubjectEndPos(regex4DigitTimePos);
          } else {
            if (regex2DigitTimePos > -1) {
              this.starttimefound = true;
              matches = this.textStringLower.match(regex2DigitMatch);
              hours = Number(matches[3]);
              if (hours <= 12) {
                if (!this.datefound && hours <= this.startdate.getHours()) {
                  hours += 12;
                }
                this.startdate.setHours(hours, 0, 0, 0);
                this.setSubjectEndPos(regex2DigitTimePos);
              }
            } else {
              if (regexHalfPastPos > -1) {
                this.starttimefound = true;
                matches = this.textStringLower.match(regexHalfPastMatch);
                hours = Number(matches[4]);
                this.startdate.setHours(hours, 30, 0, 0);
                this.setSubjectEndPos(regexHalfPastPos);
              } else {
                if (regexQuarterPastPos > -1) {
                  this.starttimefound = true;
                  matches = this.textStringLower.match(regexQuarterPastMatch);
                  hours = Number(matches[4]);
                  this.startdate.setHours(hours, 15, 0, 0);
                  this.setSubjectEndPos(regexQuarterPastPos);
                } else {
                  if (regexQuarterToPos > -1) {
                    this.starttimefound = true;
                    matches = this.textStringLower.match(regexQuarterToMatch);
                    hours = Number(matches[4]) - 1;
                    this.startdate.setHours(hours, 45, 0, 0);
                    this.setSubjectEndPos(regexQuarterToPos);
                  } else {
                    if (regexTimeNumberWordPos > -1) {
                      this.starttimefound = true;
                      matches = this.textStringLower.match(regexTimeNumberWordMatch);
                      hours = this.convertTimeNumber(matches[3]);

                      if (hours <= 12) {
                        if (!this.datefound && hours <= this.startdate.getHours()) {
                          hours += 12;
                        }
                      }
                      this.startdate.setHours(hours, 0, 0, 0);
                      if(matches[5]){
                        this.pmKeywordFound = true;
                      }
                      this.setSubjectEndPos(regexTimeNumberWordPos);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    if (this.pmKeywordFound) {
      if (this.startdate.getHours() <= 12) {
        this.startdate.setHours(this.startdate.getHours() + 12);
      }
    }
  };


  // Find duration - e.g. for 2 hours
  this.findDuration = function() {

    var regexForXDaysMatch = /([^a-z]+|^)(for )([1-9][0-9]*)( days| day)([^a-z]+|$)/;
    var regexForXDaysPos = this.textStringLower.search(regexForXDaysMatch);
    var regexForXHoursMatch = /([^a-z]+|^)(for )([1-9][0-9]*)( hours| hour)([^a-z]+|$)/;
    var regexForXHoursPos = this.textStringLower.search(regexForXHoursMatch);
    var regexForXMinutesMatch = /([^a-z]+|^)(for )([1-9][0-9]*)( minutes| mins| min| minute)([^a-z]+|$)/;
    var regexForXMinutesPos = this.textStringLower.search(regexForXMinutesMatch);

    var matches;

    if (regexForXDaysPos > -1) {
      matches = this.textStringLower.match(regexForXDaysMatch);
      if (!!matches[3]) {
        this.endtimefound = true;
        this.enddate = new Date(this.enddate.getTime() + Number(matches[3])*86400000);
      }
    } else {
      if (regexForXHoursPos > -1) {
        matches = this.textStringLower.match(regexForXHoursMatch);
        if (!!matches[3]) {
          this.endtimefound = true;
          this.enddate = new Date(this.enddate.getTime() + Number(matches[3])*3600000);
        }
      } else {
        if (regexForXMinutesPos > -1) {

          matches = this.textStringLower.match(regexForXMinutesMatch);
          if (!!matches[3]) {
            this.endtimefound = true;
            this.enddate = new Date(this.enddate.getTime() + Number(matches[3])*60000);
          }
        }
      }
    }

  };



  // Find all day keyword - e.g. "all day"
  this.findAllDayKeyword = function() {

    var regexAllDayPos = this.textStringLower.search(/([^a-z]+|^)(all day|all-day)([^a-z]+|$)/);

    if (regexAllDayPos > -1) {
      this.allday = true;
      this.setSubjectEndPos(regexAllDayPos);
    }
  };

  this.convertTimeNumber = function(text) {
    switch(text) {
      case "one":
      return 1;
      case "two":
      return 2;
      case "three":
      return 3;
      case "four":
      return 4;
      case "five":
      return 5;
      case "six":
      return 6;
      case "seven":
      return 7;
      case "eight":
      return 8;
      case "nine":
      return 9;
      case "ten":
      return 10;
      case "eleven":
      return 11;
      case "twelve":
      return 12;
      default:
      return 0;
    }
  };

  this.setSubjectEndPos = function(pos) {
    if (pos < subjectend) {
      subjectend = pos;
    }
  };

  this.populateSubject = function() {
    this.subject = this.textString.substring(subjectstart, subjectend).trim();
    if ((!!this.subject) & (this.subject.length > 0)) {
      this.subjectfound = true;
    }
  };

  // Constructor
  this.textString = text;
  this.textStringLower = text.toLowerCase();
  subjectend = text.length;
  this.parse();
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
module.exports = Cally;
