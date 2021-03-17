import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';

import {MessageService} from '../message.service';
import {AuthenticationService} from '../authentication.service';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
    fg: FormGroup = this.fb.group({
        'username': ['', [ Validators.required ]],
        'email': ['', [ Validators.email ]],
        'password': ['', [ Validators.required, Validators.minLength(8) ]],
        'passwordConfirm': ['', [ Validators.required ]],
        'captcha': ['', [ Validators.required ]],
    }, {
        validators: [ this.passwordsEqual() ]
    });

    model: any = {};
    loading = false;

    captcha: string;

    constructor(
        private router: Router,
        private authService: AuthenticationService,
        private messageService: MessageService,
        private fb: FormBuilder,
    ) {
        this.fg.controls['email'].valueChanges.subscribe(this.copyFromEmailToLogin());
    }

    ngOnInit() {
        this.authService.getCaptcha(true)
            .subscribe(img => this.captcha = img, () => this.captcha = 'Error');
    }

    register(): void {
        this.loading = true;
        this.authService.createUser(this.model) // TODO: change to register request
            .subscribe(
                data => {
                    // set success message and pass true paramater to persist the message after redirecting to the login page
                    this.messageService.add('Registration successful');
                    this.router.navigate(['/user/details?hide-change-password=true']); // TODO: set authentication credentials
                },
                error => {
                    this.messageService.add(error);
                    this.loading = false;
                });
    }

    private copyFromEmailToLogin(): (value: string) => void {
        return (value: string) => {
            const usernameControl = this.fg.controls['username'];
            if (usernameControl.touched) return;

            usernameControl.setValue(value);
        };
    }

    private passwordsEqual(): ValidatorFn {
        return (formGroup: FormGroup): ValidationErrors | null => {
            const { password, passwordConfirm } = formGroup.value;
            return password !== passwordConfirm ? { passwordsEqual: true } : null;
        };
    }
}
