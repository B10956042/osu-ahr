import { Lobby, Player } from "..";
import { BanchoResponseType } from "../parsers";
import { LobbyPlugin } from "./LobbyPlugin";
import config from "config";

const TeamModes = [
  "Head To Head",
  "Tag Coop",
  "Team Vs",
  "Tag Team Vs"
];

const ScoreModes = [
  "Score",
  "Accuracy",
  "Combo",
  "Score V2"
];

export interface LobbyKeeperOption {
  /**
   * team 0: Head To Head, 1: Tag Coop, 2: Team Vs, 3: Tag Team Vs
   * score 0: Score, 1: Accuracy, 2: Combo, 3: Score V2
   */
  mode: { team: number, score: number } | null;

  /**
   * 1-16
   */
  size: number | null;

  password: string | null;

  /**
   * EZ, NF, HR, SD, DT, NC, FL, HD, FI, Relax, AP, SO, Freemod, None
   */
  mods: string | null;
}

export class LobbyKeeper extends LobbyPlugin {
  option: LobbyKeeperOption;
  constructor(lobby: Lobby, option: Partial<LobbyKeeperOption> = {}) {
    super(lobby, "keeper");
    const d = config.get<LobbyKeeperOption>("LobbyKeeper");
    this.option = { ...d, ...option } as LobbyKeeperOption;
    this.registerEvents();
  }

  private registerEvents(): void {
    this.lobby.MatchFinished.on(a => this.onMatchFinished());
    this.lobby.ReceivedChatCommand.on(a => this.onChatCommand(a.player, a.command, a.param));
    this.lobby.ReceivedBanchoResponse.on(a => {
      switch (a.response.type) {
        case BanchoResponseType.KickedPlayer:
          this.fixLobbyModeAndSize();
          break;
      }
    });
  }

  private onChatCommand(player: Player, command: string, param: string): void {
    if (player.isAuthorized) {
      if (command.startsWith("*keep") || command.startsWith("*no")) {
        const msg = this.processCommand(command, param);
        if (msg != null) {
          this.lobby.SendMessage(msg);
        }
      } 
    }    
  }

  private onMatchFinished(): void {
    this.fixLobbyModeAndSize();
    this.fixPassword();
    this.fixMods();
  }

  private fixLobbyModeAndSize(): void {
    if (this.option.mode != null) {
      if (this.option.size != null) {
        this.lobby.SendMessage(`!mp set ${this.option.mode.team} ${this.option.mode.score} ${this.option.size}`);
      } else {
        this.lobby.SendMessage(`!mp set ${this.option.mode.team} ${this.option.mode.score}`);
      }
    } else {
      if (this.option.size != null) {
        this.lobby.SendMessage(`!mp size ${this.option.size}`);
      }
    }
  }

  private fixPassword(): void {
    if (this.option.password != null) {
      this.lobby.SendMessage(`!mp password ${this.option.password}`);
    }
  }

  private fixMods(): void {
    if (this.option.mods != null) {
      this.lobby.SendMessage(`!mp mods ${this.option.mods}`)
    }
  }

  private processCommand(command: string, param: string): string | null {
    if (command == "*keep") {
      const regMode = /^mode\s+([0-3])\s+([0-3])\s*$/;
      const matchMode = regMode.exec(param);
      if (matchMode) {
        this.option.mode = {
          team: parseInt(matchMode[1]),
          score: parseInt(matchMode[2])
        };
        this.fixLobbyModeAndSize();
        return `keep lobby mode ${TeamModes[this.option.mode.team]}, ${ScoreModes[this.option.mode.score]}`;
      }
      const regSize = /^size\s+(\d+)\s*$/;
      const matchSize = regSize.exec(param);
      if (matchSize) {
        const size = parseInt(matchSize[1]);
        if (1 < size && size <= 16) {
          this.option.size = size;
          this.fixLobbyModeAndSize();
          return `keep lobby size ${this.option.size}`;
        }
      }

      const regPassword = /^password\s*(.+)?\s*$/;
      const matchPassword = regPassword.exec(param);
      if (matchPassword) {
        this.option.password = matchPassword[1] !== undefined ? matchPassword[1] : "";
        this.fixPassword();
        return `keep lobby password ${this.option.password !== "" ? this.option.password : "[empty]"}`;
      }

      const regMods = /^mods?\s*(.+)?\s*$/;
      const matchMods = regMods.exec(param);
      if (matchMods) {
        this.option.mods = matchMods[1] !== undefined ? matchMods[1] : "freemod";
        this.fixMods();
        return `keep mods ${this.option.mods}`;
      }
    }
    if (command == "*no") {
      if (param == "keep mode" && this.option.mode != null) {
        this.option.mode = null;
        return "disabled keeping teammode and scoremode";
      }
      if (param == "keep size" && this.option.size != null) {
        this.option.size = null;
        return "disabled keeping lobby size";
      }
      if (param == "keep password" && this.option.password != null) {
        if (this.option.password != "" ) {
          this.option.password = "";
          this.fixPassword();
        }
        this.option.password = null;
        return "disabled keeping lobby password"; 
      }
      if (param.startsWith("keep mod") && this.option.mods != null) {
        this.option.mods = "freemod";
        this.fixMods();        
        this.option.mods = null;
        return "disabled keeping mods"; 
      }
    }
    return null;
  }

  GetPluginStatus(): string {
    return `-- Lobby Keeper --
  mode : ${this.option.mode === null ? "disabled" : TeamModes[this.option.mode.team] + ", " + ScoreModes[this.option.mode.score]};
  size : ${this.option.size === null ? "disabled" : this.option.size}
  password : ${this.option.password === null ? "disabled" : this.option.password === "" ? '""' : this.option.password}
  mods : ${this.option.mods === null ? "disabled" : this.option.mods}`;
  }
}