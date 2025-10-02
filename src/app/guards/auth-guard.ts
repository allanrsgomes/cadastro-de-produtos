import { CanActivateFn, Router } from "@angular/router";
import { UserService } from "../services/user";
import { inject } from "@angular/core";
import { UserAuthService } from "../services/user-auth";
import { firstValueFrom } from "rxjs";

export const authGuard: CanActivateFn = async (route, state) => {
  const _userService = inject(UserService);
  const _userAuthService = inject(UserAuthService);
  const _router = inject(Router);
  const HAS_TOKEN = _userAuthService.getUserToken();

  if(!HAS_TOKEN) {
    return _router.navigate(['/login']);
  }

  try {
    await firstValueFrom(_userService.validateUser());
    return true;
  } catch (error) {
    return _router.navigate(['/login']);
  }
};
