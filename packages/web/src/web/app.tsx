import { Route, Switch } from "wouter";
import Index from "./pages/index";
import Live from "./pages/live";
import League from "./pages/league";
import Profile from "./pages/profile";
import Auth from "./pages/auth";
import Debate from "./pages/debate";
import { NotFound } from "./pages/not-found";
import { Provider } from "./components/provider";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/canli" component={Live} />
        <Route path="/liqa" component={League} />
        <Route path="/profil" component={Profile} />
        <Route path="/giris" component={Auth} />
        <Route path="/debat/:id" component={Debate} />
        <Route component={NotFound} />
      </Switch>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
