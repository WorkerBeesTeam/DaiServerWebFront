import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupStatusComponent } from './group-status.component';

describe('GroupStatusComponent', () => {
  let component: GroupStatusComponent;
  let fixture: ComponentFixture<GroupStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
