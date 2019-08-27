import { assert } from 'chai';
import { parser, BanchoResponseType } from "../models";
import log4js from "log4js";
describe("CommandParserTest", function () {
  before(function () {
    log4js.configure("config/log_mocha_silent.json");
  });
  it("make lobby message parse test", () => {
    let message = "Created the tournament match https://osu.ppy.sh/mp/52612489 irctestroom";
    let v = parser.ParseMpMakeResponse("BanchoBot", message);
    if (v == null) {
      assert.fail();
    } else {
      assert.equal(v.id, "52612489");
      assert.equal(v.title, "irctestroom");
    }

    message = "Created the tournament match https://osu.ppy.sh/mp/52849259 irctest_room^^";
    v = parser.ParseMpMakeResponse("BanchoBot", message);
    if (v == null) {
      assert.fail();
    } else {
      assert.equal(v.id, "52849259");
      assert.equal(v.title, "irctest_room^^");
    }

    message = "Created the tournament match https://osu.ppy.sh/mp/52849326 irc test room 1";
    v = parser.ParseMpMakeResponse("BanchoBot", message);
    if (v == null) {
      assert.fail();
    } else {
      assert.equal(v.id, "52849326");
      assert.equal(v.title, "irc test room 1");
    }
  });

  it("ParseMPCommandTest", () => {
    let message = "!mp host xxx";
    let v = parser.ParseMPCommand(message);
    if (v == null) {
      assert.fail();
    } else {
      assert.equal(v.command, "host");
      assert.equal(v.args[0], "xxx");
    }

    message = "!mp make xxx";
    v = parser.ParseMPCommand(message);
    if (v == null) {
      assert.fail();
    } else {
      assert.equal(v.command, "make");
      assert.equal(v.args[0], "xxx");
    }

    message = "xx!mp make xxx";
    v = parser.ParseMPCommand(message);
    if (v != null) {
      assert.fail();
    }
  });

  describe("ParseBanchoResponse tests", () => {
    it("player joined parse test", () => {
      let message = "Swgciai joined in slot 4.";
      let v = parser.ParseBanchoResponse(message);
      if (v.type == BanchoResponseType.PlayerJoined) {
        assert.equal(v.params[0], "Swgciai");
        assert.equal(v.params[1], 4);
      } else {
        assert.fail();
      }

      message = "Foet_Mnagyo joined in slot 1.";
      v = parser.ParseBanchoResponse(message);
      if (v.type == BanchoResponseType.PlayerJoined) {
        assert.equal(v.params[0], "Foet_Mnagyo");
        assert.equal(v.params[1], 1);
      } else {
        assert.fail();
      }

      message = "- Cylcl joined in slot 5.";
      v = parser.ParseBanchoResponse(message);
      if (v.type == BanchoResponseType.PlayerJoined) {
        assert.equal(v.params[0], "- Cylcl");
        assert.equal(v.params[1], 5);
      } else {
        assert.fail();
      }
    });

    it("player left parse test", () => {
      let message = "Swgciai left the game.";
      let v = parser.ParseBanchoResponse(message);
      if (v.type == BanchoResponseType.PlayerLeft) {
        assert.equal(v.params[0], "Swgciai");
      } else {
        assert.fail();
      }

      message = "Foet_Mnagyo left the game.";
      v = parser.ParseBanchoResponse(message);
      if (v.type == BanchoResponseType.PlayerLeft) {
        assert.equal(v.params[0], "Foet_Mnagyo");
      } else {
        assert.fail();
      }

      message = "- Cylcl left the game.";
      v = parser.ParseBanchoResponse(message);
      if (v.type == BanchoResponseType.PlayerLeft) {
        assert.equal(v.params[0], "- Cylcl");
      } else {
        assert.fail();
      }
    });

    it("map changing test", () => {
      let message = "Host is changing map...";
      let v = parser.ParseBanchoResponse(message);
      assert.equal(v.type, BanchoResponseType.BeatmapChanging);
    });

    it("map changed test", () => {
      let message = "Beatmap changed to: Noah - Celestial stinger [apl's EXHAUST] (https://osu.ppy.sh/b/1454083)";
      let v = parser.ParseBanchoResponse(message);
      if (v.type == BanchoResponseType.BeatmapChanged) {
        assert.equal(v.params[0], "1454083");
      } else {
        assert.fail();
      }

      message = "Beatmap changed to: Paul Bazooka - DrunkenSteiN [bor's Insane] (https://osu.ppy.sh/b/1913126)";
      v = parser.ParseBanchoResponse(message);
      if (v.type == BanchoResponseType.BeatmapChanged) {
        assert.equal(v.params[0], "1913126");
      } else {
        assert.fail();
      }

      message = "Beatmap changed to: supercell - Hoshi ga Matataku Konna Yoru ni [Sharlo's Insane] (https://osu.ppy.sh/b/670743)";
      v = parser.ParseBanchoResponse(message);
      if (v.type == BanchoResponseType.BeatmapChanged) {
        assert.equal(v.params[0], "670743");
      } else {
        assert.fail();
      }
    });

    it("host change test", () => {
      let message = "Swgciai became the host.";
      let v = parser.ParseBanchoResponse(message);
      if (v.type == BanchoResponseType.HostChanged) {
        assert.equal(v.params[0], "Swgciai");
      } else {
        assert.fail();
      }

      message = "Foet_Mnagyo became the host.";
      v = parser.ParseBanchoResponse(message);
      if (v.type == BanchoResponseType.HostChanged) {
        assert.equal(v.params[0], "Foet_Mnagyo");
      } else {
        assert.fail();
      }

      message = "- Cylcl became the host.";
      v = parser.ParseBanchoResponse(message);
      if (v.type == BanchoResponseType.HostChanged) {
        assert.equal(v.params[0], "- Cylcl");
      } else {
        assert.fail();
      }
    });

    it("match test", () => {
      let v = parser.ParseBanchoResponse("The match has started!");
      assert.equal(v.type, BanchoResponseType.MatchStarted);

      let message = "Swgciai finished playing (Score: 18048202, PASSED).";
      v = parser.ParseBanchoResponse(message);
      if (v.type == BanchoResponseType.PlayerFinished) {
        assert.equal(v.params[0], "Swgciai");
        assert.equal(v.params[1], 18048202);
        assert.equal(v.params[2], true);
      } else {
        assert.fail();
      }

      message = "Foet_Mnagyo finished playing (Score: 290043, FAILED).";
      v = parser.ParseBanchoResponse(message);
      if (v.type == BanchoResponseType.PlayerFinished) {
        assert.equal(v.params[0], "Foet_Mnagyo");
        assert.equal(v.params[1], 290043);
        assert.equal(v.params[2], false);
      } else {
        assert.fail();
      }

      message = "- Cylcl finished playing (Score: 2095838, PASSED).";
      v = parser.ParseBanchoResponse(message);
      if (v.type == BanchoResponseType.PlayerFinished) {
        assert.equal(v.params[0], "- Cylcl");
        assert.equal(v.params[1], 2095838);
        assert.equal(v.params[2], true);
      } else {
        assert.fail();
      }

      v = parser.ParseBanchoResponse("The match has finished!");
      assert.equal(v.type, BanchoResponseType.MatchFinished);

      v = parser.ParseBanchoResponse("Closed the match");
      assert.equal(v.type, BanchoResponseType.ClosedMatch);
    });

    it("match abort test", () => {
      let v = parser.ParseBanchoResponse("Aborted the match");
      assert.equal(v.type, BanchoResponseType.AbortedMatch);

      v = parser.ParseBanchoResponse("The match is not in progress");
      assert.equal(v.type, BanchoResponseType.AbortMatchFailed);
    });

    it("PlayerMovedSlot test", () => {
      let v = parser.ParseBanchoResponse("azi03 moved to slot 6");
      if (v.type == BanchoResponseType.PlayerMovedSlot) {
        assert.equal(v.params[0], "azi03");
        assert.equal(v.params[1], 6);
      } else {
        assert.fail();
      }
    });

    it("MpHostChanged test", () => {
      let v = parser.ParseBanchoResponse("Changed match host to Brena_Pia");
      if (v.type == BanchoResponseType.MpHostChanged) {
        assert.equal(v.params[0], "Brena_Pia");
      } else {
        assert.fail();
      }
    });

    it("MpMatchStarted test", () => {
      let v = parser.ParseBanchoResponse("Started the match");
      assert.equal(v.type, BanchoResponseType.MpMatchStarted);
    });

    it("MpMatchAlreadyStarted test", () => {
      let v = parser.ParseBanchoResponse("The match has already been started");
      assert.equal(v.type, BanchoResponseType.MpMatchAlreadyStarted);
    });

    it("PasswordChanged test", () => {
      let v = parser.ParseBanchoResponse("Changed the match password");
      assert.equal(v.type, BanchoResponseType.PasswordChanged);
    });

    it("PasswordRemoved test", () => {
      let v = parser.ParseBanchoResponse("Removed the match password");
      assert.equal(v.type, BanchoResponseType.PasswordRemoved);
    });

    it("AddedReferees test", () => {
      let v = parser.ParseBanchoResponse("Added damn to the match referees");
      if (v.type == BanchoResponseType.AddedReferees) {
        assert.equal(v.params[0], "damn");
      } else {
        assert.fail();
      }
    })
  });

  it("ensure channel test", () => {
    let v = parser.EnsureMpChannelId("123");
    assert.equal(v, "#mp_123");

    v = parser.EnsureMpChannelId("#mp_123");
    assert.equal(v, "#mp_123");

    v = parser.EnsureMpChannelId("https://osu.ppy.sh/mp/123");
    assert.equal(v, "#mp_123");
  });

  it("SplitCliCommand test", () => {
    let v = parser.SplitCliCommand("a abcdefg");
    assert.equal(v.command, "a");
    assert.equal(v.arg, "abcdefg");

    v = parser.SplitCliCommand("a b c");
    assert.equal(v.command, "a");
    assert.equal(v.arg, "b c");

    v = parser.SplitCliCommand("a");
    assert.equal(v.command, "a");
    assert.equal(v.arg, "");
  });

  describe("parse custom command tests", function () {
    it("IsCustomCommand?", () => {
      const valids = ["!aioie", "!a", "!123", "!a ", "!v x", "!vv x y[v]", "*abc"];
      const invalids = ["!", "*", "  !asa", "!!ss", "*!v", "abc", "abc !abc"];
      const used = ["!help", "!Help", "!info", "!skip", "!SKIP", "!queue", "!q", "*skip", "*stipto"];
      const reservedInvalid = ["!mp", "!mp start", "!roll", "!roll 100", "!where abc", "!faq", "!report", "!request"];
      valids.forEach(c => assert.isTrue(parser.IsCustomCommand(c), c));
      invalids.forEach(c => assert.isFalse(parser.IsCustomCommand(c), c));
      used.forEach(c => assert.isTrue(parser.IsCustomCommand(c), c));
      reservedInvalid.forEach(c => assert.isFalse(parser.IsCustomCommand(c), c));
    });
    it("ParseCustomCommand", () => {
      let v = parser.ParseCustomCommand("!abc");
      assert.equal(v.command, "!abc");
      assert.equal(v.param, "");

      v = parser.ParseCustomCommand("!a a");
      assert.equal(v.command, "!a");
      assert.equal(v.param, "a");

      v = parser.ParseCustomCommand("!a  a ");
      assert.equal(v.command, "!a");
      assert.equal(v.param, "a");

      v = parser.ParseCustomCommand("!a a b");
      assert.equal(v.command, "!a");
      assert.equal(v.param, "a b");

      v = parser.ParseCustomCommand("!a   a    b  ");
      assert.equal(v.command, "!a");
      assert.equal(v.param, "a    b");
    });
    it("Case insensitive check", () => {
      assert.isTrue(parser.IsCustomCommand("!abc"));
      let v = parser.ParseCustomCommand("!abc");
      assert.equal(v.command, "!abc");
      assert.equal(v.param, "");

      assert.isTrue(parser.IsCustomCommand("!Abc"));
      v = parser.ParseCustomCommand("!Abc");
      assert.equal(v.command, "!abc");
      assert.equal(v.param, "");

      assert.isTrue(parser.IsCustomCommand("!ABC"));
      v = parser.ParseCustomCommand("!ABC");
      assert.equal(v.command, "!abc");
      assert.equal(v.param, "");

      assert.isTrue(parser.IsCustomCommand("!AbC aiueo AIUEO"));
      v = parser.ParseCustomCommand("!AbC aiueo AIUEO");
      assert.equal(v.command, "!abc");
      assert.equal(v.param, "aiueo AIUEO");
    });
  });
});